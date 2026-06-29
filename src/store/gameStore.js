import { create } from 'zustand';
import { io } from 'socket.io-client';

import { MONSTERS } from '../game/systems/MonsterDB';

export const TOWER_FLOORS = [];
for (let i = 29; i >= 1; i--) {
  let zoneId = "Z1";
  let color = 0x4CAF82;
  let isBoss = false;

  if (i >= 27) {
    zoneId = "FINAL";
    color = 0xFFD700;
    if (i === 29) isBoss = true;
  } else if (i >= 21) {
    zoneId = "Z5";
    color = 0xFF5722;
  } else if (i >= 16) {
    zoneId = "Z4";
    color = 0xD4A853;
  } else if (i >= 11) {
    zoneId = "Z3";
    color = 0x9C27B0;
  } else if (i >= 6) {
    zoneId = "Z2";
    color = 0x00BCD4;
  }

  const monsterName = MONSTERS[i]?.name || `Floor ${i}`;

  TOWER_FLOORS.push({
    n: i,
    z: zoneId,
    name: monsterName,
    color: color,
    boss: isBoss
  });
}

let socketInstance = null;

const useGameStore = create((set, get) => ({
  // Wallet / Auth State
  walletConnected: false,
  hasAccess: false,
  walletAddress: null,
  
  // Game State
  currentScene: 'Boot', // Boot, WalletGate, WorldMap, Battle
  currentZone: 1,
  currentHeroId: 'demon_samurai',
  gameMode: 'pve', // 'pve' or 'pvp'
  
  // Progression State
  highestFloorCleared: 1,
  username: null,
  walletConnected: false,
  
  // Gesture State
  latestPrediction: null, // { char: 'A', confidence: 0.95, timestamp: 1234 }
  
  // Battle State
  targetSign: null, // e.g. "A" or "FIRE"
  lastAction: null, // { type: 'player_attack' | 'monster_attack', timestamp: 1234 }
  battleState: 'loading', // 'loading' | 'active'

  // Multiplayer State
  socketConnected: false,
  mpHandle: null,
  mpRoomId: null,
  mpOpponent: null, // { handle: 'opponent_x' }
  mpStatus: 'idle', // 'idle' | 'searching' | 'found' | 'active' | 'ended'
  mpRound: 1,
  mpScores: {},
  mpSeed: null,
  mpReady: false,
  mpOpponentReady: false,
  isHost: true,
  opponentLandmarks: null,
  opponentHitCount: 0,
  opponentMissCount: 0,
  
  // Actions
  setWalletStatus: (connected, access, address) => {
    console.log("setWalletStatus called:", { connected, access, address });
    set({ 
      walletConnected: connected, 
      hasAccess: access,
      walletAddress: address
    });

    // Sync progress from Supabase when connected
    if (connected && address) {
      console.log("Wallet connected and address provided, fetching from Supabase...");
      import('../lib/supabaseClient').then(({ supabase }) => {
        // Prevent fetching if anon key is not set
        if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn("DB config missing. Skipping sync.");
          return;
        }

        supabase
          .from('user_progress')
          .select('highest_floor_cleared, username')
          .eq('wallet_address', address)
          .single()
          .then(({ data, error }) => {
              if (error) {
              if (error.code === 'PGRST116') {
                // Record not found, create new one
                const defaultUsername = 'Player_' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
                supabase.from('user_progress').insert({
                  wallet_address: address,
                  username: defaultUsername,
                  highest_floor_cleared: 0
                }).then(({ error: insertErr }) => {
                  if (insertErr) console.error("Insert error:", insertErr);
                });
                set({ highestFloorCleared: 0, username: defaultUsername });
              } else {
                console.error("Error fetching progress:", error);
              }
            } else if (data) {
              console.log(`Loaded progress: Floor ${data.highest_floor_cleared}, Username ${data.username}`);
              let u = data.username;
              if (!u) {
                 u = 'Player_' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
                 supabase.from('user_progress').update({ username: u }).eq('wallet_address', address).then(({ error: updateErr }) => {
                   if (updateErr) console.error("Update error:", updateErr);
                   else console.log("Successfully saved auto-generated username:", u);
                 });
              }
              set({ highestFloorCleared: data.highest_floor_cleared, username: u });
            }
          });
      });
    }
  },
  setHero: (heroId) => set({ currentHeroId: heroId }),
  setBattleState: (state) => set({ battleState: state }),
  setScene: (scene) => set({ currentScene: scene }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setTargetSign: (sign) => set({ targetSign: sign }),
  setGesturePrediction: (prediction) => set({ latestPrediction: prediction }),
  triggerAction: (type, data = null) => {
    set({ lastAction: { type, timestamp: Date.now(), data } });
    const { socketConnected, mpRoomId } = get();
    if (socketConnected && mpRoomId && socketInstance) {
      if (type === 'player_attack') socketInstance.emit('player_hit', { roomId: mpRoomId });
      if (type === 'monster_attack') socketInstance.emit('player_miss', { roomId: mpRoomId });
    }
  },
  
  // Progression Actions
  clearFloor: (floorNum) => {
    const state = get();
    const newHighest = Math.max(state.highestFloorCleared, floorNum);
    set({ highestFloorCleared: newHighest });
    
    // Save to Supabase if connected
    if (state.walletConnected && state.walletAddress) {
      import('../lib/supabaseClient').then(({ supabase }) => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return; // Skip if no key

        supabase.from('user_progress').upsert({
          wallet_address: state.walletAddress,
          highest_floor_cleared: newHighest,
          last_updated: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.error("Error saving progress");
          else console.log(`Saved progress: Floor ${newHighest}`);
        });
      });
    }
  },
  setCurrentFloor: (floorNum) => set({ currentFloor: floorNum }),

  updateUsername: async (newUsername) => {
    const state = get();
    if (!state.walletConnected || !state.walletAddress) return { success: false, error: "Not connected" };
    
    const { supabase } = await import('../lib/supabaseClient');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return { success: false, error: "DB config missing" };

    const { error } = await supabase.from('user_progress').update({ username: newUsername }).eq('wallet_address', state.walletAddress);
    if (error) {
      if (error.code === '23505') { // Postgres unique violation
        return { success: false, error: "This name is already taken. Please try another." };
      }
      console.error("Supabase update error:", error);
      return { success: false, error: "Failed to save name. Please try again." };
    }
    set({ username: newUsername });
    return { success: true };
  },

  // Multiplayer Actions
  connectSocket: () => {
    if (!socketInstance) {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001";
      console.log("Connecting multiplayer...");
      socketInstance = io(wsUrl, { transports: ["websocket"], upgrade: false });
      
      socketInstance.on("connect", () => {
        console.log("Multiplayer connected.");
        set({ socketConnected: true });
      });
      
      socketInstance.on("connect_error", (err) => {
        console.error("Multiplayer connection error.");
      });
      
      socketInstance.on("disconnect", (reason) => {
        console.warn("Multiplayer disconnected.");
        set({ socketConnected: false, mpStatus: 'idle', mpRoomId: null, mpOpponent: null, mpReady: false, mpOpponentReady: false, mpOpponentHeroId: null });
      });
      
      socketInstance.on("room_created", ({ roomId }) => {
        console.log("Room Created.");
        set({ mpRoomId: roomId, mpStatus: 'searching', isHost: true });
      });
      
      socketInstance.on("room_joined", ({ roomId, opponentHandle }) => {
        console.log("Joined Room.");
        set({ mpRoomId: roomId, mpOpponent: { handle: opponentHandle }, mpStatus: 'found', isHost: false });
      });
      
      socketInstance.on("opponent_joined", ({ opponentHandle }) => {
        console.log("Opponent Joined.");
        set({ mpOpponent: { handle: opponentHandle }, mpStatus: 'found' });
      });
      
      socketInstance.on("player_ready_status", ({ handle, heroId }) => {
        const { mpOpponent } = get();
        if (mpOpponent && mpOpponent.handle === handle) {
          console.log("Opponent is READY.");
          set({ mpOpponentReady: true, mpOpponentHeroId: heroId });
        }
      });
      
      socketInstance.on("player_unready_status", ({ handle }) => {
        const { mpOpponent } = get();
        if (mpOpponent && mpOpponent.handle === handle) {
          console.log("Opponent is UNREADY.");
          set({ mpOpponentReady: false });
        }
      });
      
      socketInstance.on("countdown_start", () => {
        console.log("Countdown started!");
        set({ mpStatus: 'countdown' });
      });

      socketInstance.on("battle_start", ({ seed, round }) => {
        console.log(`Battle Started! Round: ${round}`);
        set({ mpSeed: seed, mpRound: round, mpStatus: 'active' });
      });
      
      socketInstance.on("round_resolved", ({ round, scores, winnerHandle }) => {
        console.log(`Round ${round} Resolved.`);
        const { mpHandle, mpOpponent } = get();
        let youScore = 0;
        let oppScore = 0;
        if (mpHandle) youScore = scores[mpHandle] || 0;
        if (mpOpponent?.handle) oppScore = scores[mpOpponent.handle] || 0;
        set({ mpScores: { you: youScore, opp: oppScore }, mpRound: round });
      });
      
      socketInstance.on("match_result", ({ winnerHandle, loserHandle }) => {
        console.log("Match Ended.");
        set({ mpWinner: winnerHandle, mpStatus: 'ended' });
      });
      
      socketInstance.on("error", (err) => {
        console.error("Multiplayer Server Error.");
      });
      
      socketInstance.on("opponent_landmarks", (landmarks) => set({ opponentLandmarks: landmarks }));
      socketInstance.on("opponent_hit", () => set((state) => ({ opponentHitCount: state.opponentHitCount + 1 })));
      socketInstance.on("opponent_miss", () => set((state) => ({ opponentMissCount: state.opponentMissCount + 1 })));
    }
  },
  disconnectSocket: () => {
    if (socketInstance) {
      console.log("Manually disconnecting.");
      socketInstance.disconnect();
      socketInstance = null;
    }
  },
  createPvPRoom: (bet, playerHandle, signature, pubkey) => {
    set({ 
      mpHandle: playerHandle,
      mpOpponent: null,
      mpScores: {},
      mpRound: 1,
      mpWinner: null,
      mpReady: false,
      mpOpponentReady: false,
      mpOpponentHeroId: null,
      opponentLandmarks: null,
      opponentHitCount: 0,
      opponentMissCount: 0
    });
    if (socketInstance) {
      socketInstance.emit("create_room", { bet, playerHandle, signature, pubkey });
    }
  },
  getRoomInfo: (roomId, callback) => {
    if (socketInstance) {
      socketInstance.emit("get_room_info", roomId, callback);
    } else {
      callback({ error: "No socket connection" });
    }
  },
  joinPvPRoom: (roomId, playerHandle, signature, pubkey) => {
    set({ 
      mpHandle: playerHandle, 
      mpRoomId: roomId,
      mpOpponent: null,
      mpScores: {},
      mpRound: 1,
      mpWinner: null,
      mpReady: false,
      mpOpponentReady: false,
      mpOpponentHeroId: null,
      opponentLandmarks: null,
      opponentHitCount: 0,
      opponentMissCount: 0
    });
    if (socketInstance) {
      socketInstance.emit("join_room", { roomId, playerHandle, signature, pubkey });
    }
  },
  sendReady: () => {
    const { mpRoomId, currentHeroId } = get();
    if (socketInstance && mpRoomId) {
      socketInstance.emit("player_ready", { roomId: mpRoomId, heroId: currentHeroId });
      set({ mpReady: true });
    }
  },
  sendUnready: () => {
    const { mpRoomId } = get();
    if (socketInstance && mpRoomId) {
      socketInstance.emit("player_unready", { roomId: mpRoomId });
      set({ mpReady: false });
    }
  },
  sendHit: () => {
    const { mpRoomId } = get();
    if (socketInstance && mpRoomId) socketInstance.emit("player_hit", { roomId: mpRoomId });
  },
  sendMiss: () => {
    const { mpRoomId } = get();
    if (socketInstance && mpRoomId) socketInstance.emit("player_miss", { roomId: mpRoomId });
  },
  startPvPBattle: () => {
    const { mpRoomId } = get();
    if (socketInstance && mpRoomId) socketInstance.emit("start_battle", { roomId: mpRoomId });
  },
  submitRoundResult: (accuracy, hits) => {
    const { mpRoomId } = get();
    if (socketInstance && mpRoomId) socketInstance.emit("round_result", { roomId: mpRoomId, accuracy, hits });
  },
  sendLandmarks: (landmarks) => {
    const { mpRoomId } = get();
    if (socketInstance && mpRoomId) socketInstance.emit("landmarks", { roomId: mpRoomId, landmarks });
  }
}));

export default useGameStore;

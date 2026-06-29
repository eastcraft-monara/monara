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
  highestFloorCleared: 0,
  currentFloor: 1,
  
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
    set({ 
      walletConnected: connected, 
      hasAccess: access,
      walletAddress: address
    });

    // Sync progress from Supabase when connected
    if (connected && address) {
      import('../lib/supabaseClient').then(({ supabase }) => {
        // Prevent fetching if anon key is not set
        if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Skipping progress sync.");
          return;
        }

        supabase
          .from('user_progress')
          .select('highest_floor_cleared')
          .eq('wallet_address', address)
          .single()
          .then(({ data, error }) => {
            if (error) {
              if (error.code === 'PGRST116') {
                // Record not found, create new one
                supabase.from('user_progress').insert({
                  wallet_address: address,
                  highest_floor_cleared: 1
                }).then();
                set({ highestFloorCleared: 1 });
              } else {
                console.error("[Supabase] Error fetching progress:", error.message || error);
              }
            } else if (data) {
              console.log(`[Supabase] Loaded progress for ${address}: Floor ${data.highest_floor_cleared}`);
              set({ highestFloorCleared: data.highest_floor_cleared });
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
          if (error) console.error("[Supabase] Error saving progress:", error.message || error);
          else console.log(`[Supabase] Saved progress: Floor ${newHighest}`);
        });
      });
    }
  },
  setCurrentFloor: (floorNum) => set({ currentFloor: floorNum }),

  // Multiplayer Actions
  connectSocket: () => {
    if (!socketInstance) {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001";
      console.log("[Socket] Attempting to connect to:", wsUrl);
      socketInstance = io(wsUrl, { transports: ["websocket"], upgrade: false });
      
      socketInstance.on("connect", () => {
        console.log("[Socket] Connected successfully! ID:", socketInstance.id);
        set({ socketConnected: true });
      });
      
      socketInstance.on("connect_error", (err) => {
        console.error("[Socket] Connection Error:", err.message);
      });
      
      socketInstance.on("disconnect", (reason) => {
        console.warn("[Socket] Disconnected. Reason:", reason);
        set({ socketConnected: false, mpStatus: 'idle', mpRoomId: null, mpOpponent: null, mpReady: false, mpOpponentReady: false });
      });
      
      socketInstance.on("room_created", ({ roomId }) => {
        console.log(`[Socket] Room Created successfully: ${roomId}`);
        set({ mpRoomId: roomId, mpStatus: 'searching', isHost: true });
      });
      
      socketInstance.on("room_joined", ({ roomId, opponentHandle }) => {
        console.log(`[Socket] Joined Room: ${roomId}, Opponent: ${opponentHandle}`);
        set({ mpRoomId: roomId, mpOpponent: { handle: opponentHandle }, mpStatus: 'found', isHost: false });
      });
      
      socketInstance.on("opponent_joined", ({ opponentHandle }) => {
        console.log(`[Socket] Opponent Joined: ${opponentHandle}`);
        set({ mpOpponent: { handle: opponentHandle }, mpStatus: 'found' });
      });
      
      socketInstance.on("player_ready_status", ({ handle }) => {
        const { mpOpponent } = get();
        if (mpOpponent && mpOpponent.handle === handle) {
          console.log(`[Socket] Opponent ${handle} is READY`);
          set({ mpOpponentReady: true });
        }
      });
      
      socketInstance.on("battle_start", ({ seed, round }) => {
        console.log(`[Socket] Battle Started! Round: ${round}, Seed: ${seed}`);
        set({ mpSeed: seed, mpRound: round, mpStatus: 'active' });
      });
      
      socketInstance.on("round_resolved", ({ round, scores, winnerHandle }) => {
        console.log(`[Socket] Round ${round} Resolved. Winner: ${winnerHandle}, Scores:`, scores);
        const { mpHandle, mpOpponent } = get();
        let youScore = 0;
        let oppScore = 0;
        if (mpHandle) youScore = scores[mpHandle] || 0;
        if (mpOpponent?.handle) oppScore = scores[mpOpponent.handle] || 0;
        set({ mpScores: { you: youScore, opp: oppScore }, mpRound: round });
      });
      
      socketInstance.on("match_result", ({ winnerHandle, loserHandle }) => {
        console.log(`[Socket] Match Ended. Winner: ${winnerHandle}`);
        set({ mpWinner: winnerHandle, mpStatus: 'ended' });
      });
      
      socketInstance.on("error", (err) => {
        console.error("[Socket] Server Error:", err.message || err);
      });
      
      socketInstance.on("opponent_landmarks", (landmarks) => set({ opponentLandmarks: landmarks }));
      socketInstance.on("opponent_hit", () => set((state) => ({ opponentHitCount: state.opponentHitCount + 1 })));
      socketInstance.on("opponent_miss", () => set((state) => ({ opponentMissCount: state.opponentMissCount + 1 })));
    }
  },
  disconnectSocket: () => {
    if (socketInstance) {
      console.log("[Socket] Manually disconnecting socket.");
      socketInstance.disconnect();
      socketInstance = null;
    }
  },
  createPvPRoom: (bet, playerHandle, signature, pubkey) => {
    set({ mpHandle: playerHandle });
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
    set({ mpHandle: playerHandle, mpRoomId: roomId });
    if (socketInstance) {
      socketInstance.emit("join_room", { roomId, playerHandle, signature, pubkey });
    }
  },
  sendReady: () => {
    const { mpRoomId } = get();
    if (socketInstance && mpRoomId) {
      socketInstance.emit("player_ready", { roomId: mpRoomId });
      set({ mpReady: true });
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

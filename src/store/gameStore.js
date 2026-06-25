import { create } from 'zustand';
import { io } from 'socket.io-client';

export const TOWER_FLOORS = [
  { n: 8, z: "Z4", name: "The Guardian", boss: true, color: 0xFFD700 },
  { n: 7, z: "Z4", name: "Phrase Halls", color: 0xD4A853 },
  { n: 6, z: "Z3", name: "Shadow Oni", color: 0x673AB7 },
  { n: 5, z: "Z3", name: "Vocab Sanctum", color: 0x9C27B0 },
  { n: 4, z: "Z2", name: "Fire Imp", color: 0xFF5722 },
  { n: 3, z: "Z2", name: "Number Gate", color: 0x00BCD4 },
  { n: 2, z: "Z1", name: "Skeleton", color: 0xE8E2D9 },
  { n: 1, z: "Z1", name: "Alphabet Foot", color: 0x4CAF82 },
];

let socketInstance = null;

const useGameStore = create((set, get) => ({
  // Wallet / Auth State
  walletConnected: false,
  hasAccess: false,
  walletAddress: null,
  
  // Game State
  currentScene: 'Boot', // Boot, WalletGate, WorldMap, Battle
  currentZone: 1,
  gameMode: 'pve', // 'pve' or 'pvp'
  
  // Progression State
  highestFloorCleared: 0,
  currentFloor: 1,
  
  // Gesture State
  latestPrediction: null, // { char: 'A', confidence: 0.95, timestamp: 1234 }
  
  // Battle State
  targetSign: null, // e.g. "A" or "FIRE"
  lastAction: null, // { type: 'player_attack' | 'monster_attack', timestamp: 1234 }

  // Multiplayer State
  socketConnected: false,
  mpHandle: null,
  mpRoomId: null,
  mpOpponent: null, // { handle: 'opponent_x' }
  mpStatus: 'idle', // 'idle' | 'searching' | 'found' | 'active' | 'ended'
  mpRound: 1,
  mpScores: {},
  mpSeed: null,
  mpWinner: null,
  mpReady: false,
  mpOpponentReady: false,
  opponentLandmarks: null,
  opponentAction: null,
  
  // Actions
  setWalletStatus: (connected, access, address) => set({ 
    walletConnected: connected, 
    hasAccess: access,
    walletAddress: address
  }),
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
  clearFloor: (floorNum) => set((state) => ({
    highestFloorCleared: Math.max(state.highestFloorCleared, floorNum)
  })),
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
        set({ mpRoomId: roomId, mpStatus: 'searching' });
      });
      
      socketInstance.on("room_joined", ({ roomId, opponentHandle }) => {
        console.log(`[Socket] Joined Room: ${roomId}, Opponent: ${opponentHandle}`);
        set({ mpRoomId: roomId, mpOpponent: { handle: opponentHandle }, mpStatus: 'found' });
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
      socketInstance.on("opponent_hit", () => set({ opponentAction: { type: 'attack', timestamp: Date.now() } }));
      socketInstance.on("opponent_miss", () => set({ opponentAction: { type: 'hurt', timestamp: Date.now() } }));
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

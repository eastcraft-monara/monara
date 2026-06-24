import { create } from 'zustand';

export const TOWER_FLOORS = [
  { n: 8, z: "Z4", name: "The Guardian", boss: true, color: 0xFFD700 }, // Gold
  { n: 7, z: "Z4", name: "Phrase Halls", color: 0xD4A853 },
  { n: 6, z: "Z3", name: "Shadow Oni", color: 0x673AB7 },   // Purple
  { n: 5, z: "Z3", name: "Vocab Sanctum", color: 0x9C27B0 },
  { n: 4, z: "Z2", name: "Fire Imp", color: 0xFF5722 },     // Original Imp Color
  { n: 3, z: "Z2", name: "Number Gate", color: 0x00BCD4 },   // Cyan
  { n: 2, z: "Z1", name: "Skeleton", color: 0xE8E2D9 },      // Bone White
  { n: 1, z: "Z1", name: "Alphabet Foot", color: 0x4CAF82 }, // Green
];

const useGameStore = create((set) => ({
  // Wallet / Auth State
  walletConnected: false,
  hasAccess: false,
  walletAddress: null,
  
  // Game State
  currentScene: 'Boot', // Boot, WalletGate, WorldMap, Battle
  currentZone: 1,
  
  // Progression State
  highestFloorCleared: 0,
  currentFloor: 1,
  
  // Gesture State
  latestPrediction: null, // { char: 'A', confidence: 0.95, timestamp: 1234 }
  
  // Battle State
  targetSign: null, // e.g. "A" or "FIRE"
  lastAction: null, // { type: 'player_attack' | 'monster_attack', timestamp: 1234 }
  
  // Actions
  setWalletStatus: (connected, access, address) => set({ 
    walletConnected: connected, 
    hasAccess: access,
    walletAddress: address
  }),
  setScene: (scene) => set({ currentScene: scene }),
  setTargetSign: (sign) => set({ targetSign: sign }),
  setGesturePrediction: (prediction) => set({ latestPrediction: prediction }),
  triggerAction: (type) => set({ lastAction: { type, timestamp: Date.now() } }),
  
  // Progression Actions
  clearFloor: (floorNum) => set((state) => ({
    highestFloorCleared: Math.max(state.highestFloorCleared, floorNum)
  })),
  setCurrentFloor: (floorNum) => set({ currentFloor: floorNum })
}));

export default useGameStore;

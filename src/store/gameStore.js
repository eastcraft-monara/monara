import { create } from 'zustand';

const useGameStore = create((set) => ({
  // Wallet / Auth State
  walletConnected: false,
  hasAccess: false,
  walletAddress: null,
  
  // Game State
  currentScene: 'Boot', // Boot, WalletGate, WorldMap, Battle
  currentZone: 1,
  
  // Gesture State
  latestPrediction: null, // { char: 'A', confidence: 0.95, timestamp: 1234 }
  
  // Battle State
  targetSign: null, // e.g. "A" or "FIRE"
  
  // Actions
  setWalletStatus: (connected, access, address) => set({ 
    walletConnected: connected, 
    hasAccess: access,
    walletAddress: address
  }),
  setScene: (scene) => set({ currentScene: scene }),
  setTargetSign: (sign) => set({ targetSign: sign }),
  setGesturePrediction: (prediction) => set({ latestPrediction: prediction }),
}));

export default useGameStore;

'use client';
import React, { useState, useEffect } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import useGameStore from '@/store/gameStore';
import { C } from './theme';

import GateScreen from '@/ui/screens/GateScreen';
import MapScreen from '@/ui/screens/MapScreen';
import BattleScreen from '@/ui/screens/BattleScreen';
import CreateChallengeScreen from '@/ui/screens/CreateChallengeScreen';
import BurnScreen from '@/ui/screens/BurnScreen';
import AcceptChallengeScreen from '@/ui/screens/AcceptChallengeScreen';
import CodexScreen from '@/ui/screens/CodexScreen';

const SCREENS = [
  ["gate", "GATE"],
  ["map", "MONARA TOWER"],
  ["codex", "CHARACTER"],
  ["pvp", "PVP"],
  ["burn", "BURN"]
];

export default function App() {
  const [screen, setScreen] = useState("gate");
  const [joinId, setJoinId] = useState(null);
  const go = setScreen;

  const { disconnect, connected, publicKey } = useWallet();
  const setWalletStatus = useGameStore(s => s.setWalletStatus);
  const walletConnected = useGameStore(s => s.walletConnected);
  const username = useGameStore(s => s.username);
  const updateUsername = useGameStore(s => s.updateUsername);

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  useEffect(() => {
    if (connected && publicKey && !walletConnected) {
      setWalletStatus(true, true, publicKey.toString());
    }
  }, [connected, publicKey, walletConnected, setWalletStatus]);

  const handleLogout = async () => {
    await disconnect();
    setWalletStatus(false, false, null);
    go("gate");
  };

  const handleOpenUsernameModal = () => {
    setNewUsernameInput(username || "");
    setUsernameError("");
    setUsernameSuccess("");
    setShowUsernameModal(true);
  };

  const handleSaveUsername = async () => {
    if (!newUsernameInput.trim()) {
      setUsernameError("Username cannot be empty");
      setUsernameSuccess("");
      return;
    }
    if (newUsernameInput === username) {
      setShowUsernameModal(false);
      return;
    }
    if (newUsernameInput.length > 16) {
      setUsernameError("Username too long (max 16 characters)");
      setUsernameSuccess("");
      return;
    }
    setIsUpdatingUsername(true);
    setUsernameError("");
    setUsernameSuccess("");
    
    const res = await updateUsername(newUsernameInput.trim());
    
    setIsUpdatingUsername(false);
    if (!res.success) {
      setUsernameError(res.error);
    } else {
      setUsernameSuccess("Successfully updated!");
      setTimeout(() => {
        setShowUsernameModal(false);
      }, 1200);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const joinRoomId = urlParams.get('join');
      if (joinRoomId) {
        setJoinId(joinRoomId);
        setScreen("accept_challenge");
        window.history.replaceState(null, '', '/');
      }
    }
  }, []);

  return (
    <div style={{ background: "#060406", minHeight: "100vh", fontSmooth: "antialiased" }}>

      {/* demo screen switcher */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", gap: 6,
        padding: "10px 14px", background: "#0a070a", borderBottom: "1px solid #ffffff10",
        flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          color: C.ashDim, letterSpacing: 1.5, marginRight: 6 }}>SCREENS</span>
        {SCREENS.map(([k, label]) => (
          <button key={k} onClick={() => setScreen(k)} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, padding: "6px 13px",
            borderRadius: 3, cursor: "pointer", border: "1px solid",
            borderColor: screen === k ? C.inkGold : "#ffffff1a",
            background: screen === k ? `${C.inkGold}1a` : "transparent",
            color: screen === k ? C.inkGold : C.ashDim,
          }}>{label}</button>
        ))}
        {connected && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: "#ffffff10", padding: "4px 8px", borderRadius: 4 }} onClick={handleOpenUsernameModal} title="Edit Username">
               <span style={{ color: C.ash, fontFamily: "var(--font-saira)", fontSize: 13 }}>{username || "Loading..."}</span>
               <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ashDim }}>
                 <path d="M12 20h9" />
                 <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
               </svg>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ 
              background: "none", border: "none", cursor: "pointer", padding: "4px 10px", 
              display: "flex", alignItems: "center", gap: 6,
              color: C.inkRed, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5,
              border: "1px solid #ffffff1a", borderRadius: 3
            }}>
              LOGOUT
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {screen === "gate" && <GateScreen go={go} />}
        {screen === "map" && <MapScreen go={go} />}
        {screen === "codex" && <CodexScreen go={go} />}
        {screen === "battle" && <BattleScreen go={go} />}
        {screen === "pvp" && <CreateChallengeScreen go={go} />}
        {screen === "burn" && <BurnScreen go={go} />}
        {screen === "accept_challenge" && <AcceptChallengeScreen roomId={joinId} go={go} />}
      </div>

      {showUsernameModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 9999,
          display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#0a070a", border: "1px solid #ffffff20", padding: "24px 32px",
            borderRadius: 8, width: 320, display: "flex", flexDirection: "column", gap: 16,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ fontFamily: "var(--font-saira)", fontSize: 18, color: C.ash, fontWeight: "bold" }}>
              Update Username
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.ashDim, marginTop: -12 }}>
              Choose a unique moniker (max 16 chars)
            </div>
            
            {usernameError && (
              <div style={{ color: C.inkRed, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: "#ff000010", padding: "6px 10px", borderRadius: 4 }}>
                {usernameError}
              </div>
            )}
            
            {usernameSuccess && (
              <div style={{ color: C.inkGold, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: `${C.inkGold}15`, border: `1px solid ${C.inkGold}30`, padding: "6px 10px", borderRadius: 4 }}>
                {usernameSuccess}
              </div>
            )}
            
            <input 
              type="text" 
              value={newUsernameInput}
              onChange={(e) => setNewUsernameInput(e.target.value)}
              placeholder="e.g. Player_A1B2"
              maxLength={16}
              disabled={isUpdatingUsername}
              style={{
                background: "#ffffff0a", border: "1px solid #ffffff20", color: C.ash,
                padding: "10px 12px", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace",
                outline: "none", fontSize: 14
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
            />
            
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setShowUsernameModal(false)} disabled={isUpdatingUsername} style={{
                background: "transparent", border: "none", color: C.ashDim, cursor: "pointer",
                padding: "8px 16px", borderRadius: 4, fontFamily: "var(--font-saira)"
              }}>Cancel</button>
              <button onClick={handleSaveUsername} disabled={isUpdatingUsername} style={{
                background: C.inkGold, color: "#000", border: "none", cursor: "pointer",
                padding: "8px 16px", borderRadius: 4, fontFamily: "var(--font-saira)", fontWeight: "bold",
                opacity: isUpdatingUsername ? 0.7 : 1
              }}>
                {isUpdatingUsername ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
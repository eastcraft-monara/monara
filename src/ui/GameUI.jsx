'use client';
import React, { useState, useEffect } from "react";
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
    </div>
  );
}
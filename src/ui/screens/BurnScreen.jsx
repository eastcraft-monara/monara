import React, { useState, useEffect } from "react";
import { C, ghostBtn } from "../theme";
import useGameStore from "../../store/gameStore";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Stage, TopBar, Eyebrow, Panel, Row, RedBtn, GoldBtn } from "../components/SharedUI";
import { FlameGlyph } from "../components/Graphics";

export default function BurnScreen({ go }) {
  const [emberDone, setEmberDone] = useState(false);
  const balance = useTokenBalance();
  useEffect(() => { const t = setTimeout(() => setEmberDone(true), 1800); return () => clearTimeout(t); }, []);
  return (
    <Stage>
      <div style={{ maxWidth: 460, margin: "30px auto 0", textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <FlameGlyph />
        <h2 style={{ fontFamily: "var(--font-saira)", fontWeight: 900, fontSize: 38,
          color: C.burn, margin: 0, letterSpacing: 2 }}>DEFEATED</h2>
        <p style={{ fontFamily: "var(--font-saira)", fontStyle: "italic",
          color: C.ashDim, fontSize: 15, margin: 0 }}>
          The Fire Imp held its ground. The tower takes its toll.
        </p>

        <Panel>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: 1.5, color: C.ashDim, marginBottom: 14 }}>
            1% OF YOUR BAG · {balance.toLocaleString()} $MONARA
          </div>
          <BurnLine label="Redistributed to winner" amount={`−${(balance * 0.009).toLocaleString()}`} sub="0.9%" color={C.inkRed} />
          <div style={{ height: 10 }} />
          <BurnLine label="Burned forever" amount={`−${(balance * 0.001).toLocaleString()}`} sub="0.1%" color={C.burn} ash={emberDone} />
          <div style={{ height: 16, borderTop: "1px solid #ffffff12", margin: "14px 0 0", paddingTop: 14 }}>
            <Row label="New balance" value={`${(balance * 0.99).toLocaleString()} $MONARA`} mono gold />
            <div style={{ marginTop: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5,
              color: C.ashDim, opacity: .7 }}>
              burn tx: 4Qm…aF9 · logged on-chain {emberDone ? "✓" : "…"}
            </div>
          </div>
        </Panel>

        <div style={{ display: "flex", gap: 10 }}>
          <RedBtn small onClick={() => go("battle")}>Rematch</RedBtn>
          <button onClick={() => go("map")} style={ghostBtn}>Back to Tower</button>
        </div>
      </div>
    </Stage>
  );
}

function BurnLine({ label, amount, sub, color, ash }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      opacity: ash ? .45 : 1, transition: "opacity 1s" }}>
      <span style={{ fontFamily: "var(--font-saira)", fontSize: 14, color: C.ash }}>
        {label} <span style={{ color: C.ashDim, fontSize: 12 }}>· {sub}</span>
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 600,
        color, textShadow: `0 0 12px ${color}88` }}>{amount}</span>
    </div>
  );
}

// ============================================================
// shared UI pieces
// ============================================================






// ============================================================

// ============================================================
// SCREEN: ACCEPT CHALLENGE
// ============================================================

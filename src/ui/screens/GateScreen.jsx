import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { C } from "../theme";
import useGameStore from "../../store/gameStore";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { TowerGlyph } from "../components/Graphics";
import { Panel, Row, TierBadge, RedBtn, Stage } from "../components/SharedUI";

export function LockNote() {
  return (
    <div style={{ marginTop: 8, fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10.5, color: C.ashDim, opacity: .55, maxWidth: 360, lineHeight: 1.7 }}>
      Sell your $MONARA mid-session and the gate closes behind you. Balance is
      watched on-chain every 60 seconds.
    </div>
  );
}

export default function GateScreen({ go }) {
  const { connected, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);
  const balance = useTokenBalance();
  const { setWalletStatus } = useGameStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnterMonara = () => {
    setWalletStatus(true, true, publicKey?.toString());
    go("map");
  };

  return (
    <Stage>
      <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        <TowerGlyph size={110} />
        <div>
          <h1 style={{
            fontFamily: "var(--font-saira)", fontWeight: 900, fontSize: 46,
            color: C.ash, margin: 0, letterSpacing: 2, lineHeight: 1,
          }}>EASTCRAFT<br /><span style={{ color: C.inkRed }}>MONARA</span></h1>
          <p style={{ fontFamily: "var(--font-saira)", fontStyle: "italic",
            color: C.ashDim, marginTop: 14, fontSize: 15 }}>
            Sign to Fight. Climb the Monara.
          </p>
          {process.env.NEXT_PUBLIC_TOKEN_CA && (
            <a 
              href={`https://pump.fun/${process.env.NEXT_PUBLIC_TOKEN_CA}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                color: C.inkGold, marginTop: 8, opacity: 0.8,
                textDecoration: "underline", cursor: "pointer", display: "inline-block"
              }}
            >
              CA: {process.env.NEXT_PUBLIC_TOKEN_CA}
            </a>
          )}
        </div>

        {!connected || !mounted ? (
          <>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5,
              color: C.ashDim, lineHeight: 1.9, maxWidth: 380 }}>
              A token-gated ASL battle realm. Hold <span style={{ color: C.inkGold }}>$MONARA</span> to
              enter. Win to earn. Lose, and your coin burns to ash.
            </div>
            {mounted && <WalletMultiButton className="!bg-[#D4A853] !text-black hover:!bg-yellow-600 transition-colors !rounded-sm !font-mono !text-sm !px-8" />}
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5,
              color: C.ashDim, opacity: .6 }}>Phantom · Backpack · Solflare</div>
          </>
        ) : (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
            <Panel>
              <Row label="Wallet" value={`${publicKey?.toString().slice(0, 4)}...${publicKey?.toString().slice(-4)}`} mono />
              <Row label="$MONARA Held" value={balance.toLocaleString()} mono gold />
              <Row label="Access Tier" value={<TierBadge tier="Samurai" />} />
              <Row label="Status" value={<span style={{ color: C.gestureOk }}>● Verified on-chain</span>} mono />
            </Panel>
            <RedBtn onClick={handleEnterMonara}>Enter the Monara</RedBtn>
          </div>
        )}

        <LockNote />
      </div>
    </Stage>
  );
}

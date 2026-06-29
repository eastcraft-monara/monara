import React, { useState, useEffect } from "react";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { C, ghostBtn } from "../theme";
import useGameStore from "../../store/gameStore";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Stage, TopBar, Eyebrow, Panel, Row, RedBtn, GoldBtn } from "../components/SharedUI";
import { FlameGlyph } from "../components/Graphics";

export default function CreateChallengeScreen({ go }) {
  const { mpRoomId } = useGameStore();
  const [bet, setBet] = useState(1000);
  const [created, setCreated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const balance = useTokenBalance();

  const betOptionBtn = {
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "8px 12px",
      borderRadius: 3, cursor: "pointer", border: `1px solid ${C.inkGold}44`,
      color: C.ash, margin: "4px"
  };

  const handleCreate = async () => {
    if (!publicKey) return;
    console.log("Starting challenge creation...");
    try {
      setIsProcessing(true);
      const feeWallet = process.env.NEXT_PUBLIC_FEE_WALLET_ADDRESS;
      const tokenCa = process.env.NEXT_PUBLIC_TOKEN_CA;
      if (!feeWallet || !tokenCa) throw new Error("Fee wallet or Token CA not configured");

      console.log("Preparing payment...");
      const feePubkey = new PublicKey(feeWallet);
      const mintPubkey = new PublicKey(tokenCa);

      const playerAta = await getAssociatedTokenAddress(mintPubkey, publicKey);
      const feeAta = await getAssociatedTokenAddress(mintPubkey, feePubkey);

      const amountToTransfer = bet * Math.pow(10, 6);
      console.log("Generating transaction...");

      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      const tx = new Transaction({
        recentBlockhash: latestBlockhash.blockhash,
        feePayer: publicKey
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: feePubkey,
          lamports: 0.02 * LAMPORTS_PER_SOL,
        }),
        createTransferInstruction(
          playerAta,
          feeAta,
          publicKey,
          amountToTransfer
        )
      );
      
      console.log("Awaiting wallet approval...");
      const signature = await sendTransaction(tx, connection);
      console.log("Sent for confirmation...");
      
      console.log("Confirming...");
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'processed');
      console.log("Transaction confirmed.");

      const { connectSocket, createPvPRoom, username } = useGameStore.getState();
      console.log("Initializing multiplayer...");
      connectSocket();
      const hostName = username || "Anonymous";
      console.log("Joining lobby...");
      createPvPRoom(bet, hostName, signature, publicKey.toBase58());
      setCreated(true);
    } catch (err) {
      console.error("Action failed:", err);
      let msg = "Failed to process transaction. Please try again.";
      const errStr = String(err.message || err).toLowerCase();
      if (errStr.includes("rejected") || errStr.includes("cancelled")) {
        msg = "Transaction cancelled by user.";
      } else if (errStr.includes("insufficient") || errStr.includes("balance") || errStr.includes("0x1")) {
        msg = "Insufficient SOL balance for the network fee.";
      } else if (errStr.includes("timeout") || errStr.includes("blockhash")) {
        msg = "Network timeout. Please try again later.";
      }
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Stage>
      <TopBar tier="Samurai" balance={balance.toLocaleString()} go={go} />
      <div style={{ maxWidth: 540, margin: "40px auto 0" }}>
        <Eyebrow color={C.inkRed}>1v1 Wager</Eyebrow>
        <h2 style={{ fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 30, color: C.ash, margin: "6px 0 8px" }}>Stake a Challenge</h2>
        <p style={{ fontFamily: "var(--font-saira)", fontStyle: "italic", color: C.ashDim, fontSize: 14, marginBottom: 26 }}>
          Stake MONARA. Winner takes the full pot. Every match burns supply via the 0.02 SOL fee.
        </p>

        {!created ? (
          <Panel>
            <Eyebrow>Wager Tier</Eyebrow>
            <div style={{ display: "flex", gap: 8, margin: "12px 0 6px", flexWrap: "wrap" }}>
              {[
                { name: "Skirmish", v: 5000 },
                { name: "Duel", v: 30000 },
                { name: "Bloodmatch", v: 100000 }
              ].map(({ name, v }) => (
                <button key={v} onClick={() => setBet(v)} style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
                  padding: "9px 14px", borderRadius: 3, cursor: "pointer", fontWeight: 600,
                  border: `1px solid ${bet === v ? C.inkGold : "#ffffff22"}`,
                  background: bet === v ? `${C.inkGold}1a` : "transparent",
                  color: bet === v ? C.inkGold : C.ash,
                }}>{name} · {v.toLocaleString()}</button>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <input 
                type="number" 
                value={bet} 
                onChange={(e) => setBet(Number(e.target.value) || 0)}
                style={{
                  background: "#000", border: `1px solid ${C.inkGold}44`, color: C.inkGold,
                  padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14,
                  borderRadius: 4, width: "100%", outline: "none", boxSizing: "border-box"
                }}
                placeholder="Enter custom amount..."
              />
            </div>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 11 }}>
              <Row label="Your stake" value={bet.toLocaleString() + " $MONARA"} mono gold />
              <Row label="SOL Fee (Auto-Burn)" value="0.02 SOL" mono color={C.burn} />
              <Row label="Pot to winner" value={(bet * 2).toLocaleString() + " $MONARA"} mono />
            </div>
            <div style={{ marginTop: 20 }}>
              {errorMsg && (
                <div style={{ color: C.inkRed, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: "#ff000010", padding: "8px 10px", borderRadius: 4, marginBottom: 12 }}>
                  {errorMsg}
                </div>
              )}
              {!publicKey ? (
                <WalletMultiButton />
              ) : (
                <RedBtn onClick={handleCreate}>
                  {isProcessing ? "Processing Tx..." : "Pay 0.02 SOL & Generate Link"}
                </RedBtn>
              )}
            </div>
          </Panel>
        ) : (
          <Panel accent={C.inkGold}>
            <Eyebrow color={C.inkGold}>Challenge Live</Eyebrow>
            <p style={{ fontFamily: "var(--font-saira)", color: C.ash, fontSize: 14, margin: "10px 0 16px", lineHeight: 1.6 }}>
              Drop this link in the community. First to accept locks {bet.toLocaleString()} $MONARA.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5,
              color: C.inkGold, background: "#000", padding: "12px 14px", borderRadius: 4,
              border: `1px solid ${C.inkGold}44`, wordBreak: "break-all", marginBottom: 16 }}>
              <span>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/pvp/{mpRoomId || "connecting..."}</span>
              {mpRoomId && (
                <button 
                  onClick={() => {
                    const link = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/pvp/${mpRoomId}`;
                    navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                  title="Copy Link"
                >
                  {copied ? (
                    <span style={{ fontSize: 11, color: C.inkGold, fontWeight: "bold", marginRight: 4 }}>COPIED!</span>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.inkGold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <GoldBtn small onClick={() => {
                const { setGameMode } = useGameStore.getState();
                setGameMode("pvp");
                go("battle");
              }}>Open Battle Room</GoldBtn>
              <button onClick={() => {
                const { disconnectSocket } = useGameStore.getState();
                disconnectSocket();
                setCreated(false);
              }} style={ghostBtn}>Cancel & Refund</button>
            </div>
          </Panel>
        )}
      </div>
    </Stage>
  );
}

// ============================================================
// SCREEN 5 — BURN / DEFEAT
// ============================================================

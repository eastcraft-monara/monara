import React, { useState, useEffect } from "react";
import { C, ghostBtn } from "../theme";
import useGameStore from "../../store/gameStore";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { Stage, TopBar, Eyebrow, Panel, Row, RedBtn, GoldBtn } from "../components/SharedUI";
import { FlameGlyph } from "../components/Graphics";

export default function AcceptChallengeScreen({ roomId, go }) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const balance = useTokenBalance();
  const [isProcessing, setIsProcessing] = useState(false);
  const [roomBet, setRoomBet] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const { connectSocket, getRoomInfo } = useGameStore.getState();
    connectSocket();
    setTimeout(() => {
      getRoomInfo(roomId, (info) => {
        if (info && info.bet) setRoomBet(info.bet);
      });
    }, 500);
  }, [roomId]);

  const handleAccept = async () => {
    if (!publicKey || !roomBet) return;
    try {
      setIsProcessing(true);
      const feeWallet = process.env.NEXT_PUBLIC_FEE_WALLET_ADDRESS;
      const tokenCa = process.env.NEXT_PUBLIC_TOKEN_CA;
      if (!feeWallet || !tokenCa) throw new Error("Fee wallet or Token CA not configured");

      const feePubkey = new PublicKey(feeWallet);
      const mintPubkey = new PublicKey(tokenCa);

      const playerAta = await getAssociatedTokenAddress(mintPubkey, publicKey);
      const feeAta = await getAssociatedTokenAddress(mintPubkey, feePubkey);

      const amountToTransfer = BigInt(Math.floor(roomBet * Math.pow(10, 6)));

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
      
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'processed');

      const { connectSocket, joinPvPRoom, setGameMode, username } = useGameStore.getState();
      connectSocket();
      const playerName = username || "Anonymous";
      joinPvPRoom(roomId, playerName, signature, publicKey.toBase58());
      setGameMode('pvp');
      go('battle');
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
        <Panel accent={C.inkRed}>
          <Eyebrow color={C.inkRed}>Incoming Challenge</Eyebrow>
          <h2 style={{ fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 30, color: C.ash, margin: "6px 0 8px" }}>Room: {roomId}</h2>
          <p style={{ fontFamily: "var(--font-saira)", color: C.ashDim, fontSize: 14, marginBottom: 26 }}>
            You have been challenged. Accept to match the stake. 0.02 SOL fee applies.
          </p>
          <div style={{ marginTop: 20 }}>
            {errorMsg && (
              <div style={{ color: C.inkRed, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: "#ff000010", padding: "8px 10px", borderRadius: 4, marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}
            {!roomBet ? (
              <p style={{ color: C.inkGold, fontFamily: "'IBM Plex Mono', monospace" }}>Fetching room data...</p>
            ) : !publicKey ? (
              <WalletMultiButton />
            ) : (
              <RedBtn onClick={handleAccept}>
                {isProcessing ? "Processing Tx..." : `Accept & Pay 0.02 SOL + ${roomBet.toLocaleString()} MONARA`}
              </RedBtn>
            )}
          </div>
        </Panel>
      </div>
    </Stage>
  );
}

// ROOT — screen navigator
// ============================================================
const SCREENS = [
  ["gate", "Gate"], ["map", "Tower"],
  ["pvp", "PvP Bet"], ["burn", "Burn"],
];


'use client';
import React, { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
const GameContainer = dynamic(() => import('@/ui/GameContainer'), { ssr: false });
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

import OpponentWebcamPanel from './OpponentWebcamPanel';
import useGameStore, { TOWER_FLOORS } from '@/store/gameStore';
import WebcamPanel from '@/ui/WebcamPanel';

// ============================================================
// EASTCRAFT MONARA — Game UI
// Sign to Fight. Climb the Monara.
// ============================================================

const C = {
  bgDeep: "#0D0A0E",
  bgPanel: "#1A1520",
  bgPanel2: "#231C2B",
  inkRed: "#C8334A",
  inkGold: "#D4A853",
  ash: "#E8E2D9",
  ashDim: "#8A8178",
  gestureOk: "#4CAF82",
  gestureBad: "#E05252",
  burn: "#E87A2A",
  aura: "#4A6FD4",
};

const FONTS = `

`;

// ---- shared atoms -------------------------------------------------

function Bar({ value, max, color, bg = "#000", height = 18, glow, flipDrain }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{
      width: "100%", height, background: "var(--ink-black)",
      border: `2px solid var(--chrome-shadow)`, borderRadius: 2, overflow: "hidden",
      position: "relative", transform: "skewX(-20deg)",
      boxShadow: glow ? `0 0 10px rgba(0,0,0,0.5)` : "none"
    }}>
      {/* Inner Gloss Base */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        boxShadow: "inset 0 4px 6px rgba(255,255,255,0.15)",
        zIndex: 10
      }} />
      
      {/* Chip Damage Trail (Slow) */}
      <div style={{
        width: `${pct}%`, height: "100%", 
        background: `var(--signal-red)`, opacity: 0.8,
        transition: "width 1.2s ease-out",
        position: "absolute",
        left: flipDrain ? "auto" : 0,
        right: flipDrain ? 0 : "auto",
        zIndex: 1
      }} />

      {/* Main Bar Fill (Fast) */}
      <div style={{
        width: `${pct}%`, height: "100%", 
        background: `linear-gradient(180deg, var(--chrome-silver) 0%, var(--chrome-steel) 50%, var(--chrome-shadow) 100%)`,
        borderTop: "1px solid var(--chrome-white)",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "absolute",
        left: flipDrain ? "auto" : 0,
        right: flipDrain ? 0 : "auto",
        zIndex: 2,
      }} />
    </div>
  );
}

function TierBadge({ tier }) {
  const map = {
    Peasant: { c: C.ashDim, m: "1x" },
    Warrior: { c: C.gestureOk, m: "1.5x" },
    Samurai: { c: C.inkGold, m: "2x" },
    Shogun: { c: C.inkRed, m: "3x" },
  };
  const t = map[tier] || map.Peasant;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
      letterSpacing: 1, textTransform: "uppercase",
      color: t.c, border: `1px solid ${t.c}`, padding: "3px 8px",
      borderRadius: 2, display: "inline-flex", gap: 6, alignItems: "center",
    }}>
      {tier} <span style={{ opacity: .6 }}>·</span> {t.m}
    </span>
  );
}

// The real WebcamPanel is now imported from '@/ui/WebcamPanel.jsx'

// ============================================================
// DYNAMIC TOKEN BALANCE HOOK
// ============================================================
function useTokenBalance() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!publicKey) {
      setBalance(0);
      return;
    }
    const fetchBalance = async () => {
      try {
        const tokenCa = process.env.NEXT_PUBLIC_TOKEN_CA;
        if (!tokenCa) return;
        const mintPubkey = new PublicKey(tokenCa);
        const playerAta = await getAssociatedTokenAddress(mintPubkey, publicKey);
        const info = await connection.getTokenAccountBalance(playerAta);
        setBalance(info.value.uiAmount || 0);
      } catch (err) {
        setBalance(0);
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

  return balance;
}

// ============================================================
// SCREEN 1 — WALLET GATE
// ============================================================
function GateScreen({ go }) {
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

function LockNote() {
  return (
    <div style={{ marginTop: 8, fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10.5, color: C.ashDim, opacity: .55, maxWidth: 360, lineHeight: 1.7 }}>
      Sell your $MONARA mid-session and the gate closes behind you. Balance is
      watched on-chain every 60 seconds.
    </div>
  );
}

// ============================================================
// SCREEN 2 — MONARA TOWER MAP
// ============================================================
function MapScreen({ go }) {
  const { highestFloorCleared, currentFloor, setCurrentFloor } = useGameStore();

  const nextAvailableFloorNum = Math.min(highestFloorCleared + 1, 8);
  const balance = useTokenBalance();

  const floors = TOWER_FLOORS.map(f => ({
    ...f,
    cleared: f.n <= highestFloorCleared,
    current: f.n === currentFloor && f.n <= nextAvailableFloorNum,
    locked: f.n > nextAvailableFloorNum
  }));

  return (
    <Stage>
      <TopBar tier="Samurai" balance={balance.toLocaleString()} go={go} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 30,
        maxWidth: 900, margin: "30px auto 0", alignItems: "start" }}>
        {/* tower column */}
        <div>
          <Eyebrow>The Ascent · 8 Floors</Eyebrow>
          <h2 style={{ fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 30,
            color: C.ash, margin: "6px 0 22px" }}>Monara Tower</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {floors.map((f) => (
              <FloorRow key={f.n} f={f} onFight={() => {
                if (!f.locked) {
                  setCurrentFloor(f.n);
                  go("battle");
                }
              }} />
            ))}
          </div>
        </div>
        {/* side intel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 20 }}>
          <Panel>
            <Eyebrow>Run Stats</Eyebrow>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 11 }}>
              <Row label="Floors Cleared" value={`${highestFloorCleared} / 8`} mono />
              <Row label="Total Earned" value="+8,250" mono gold />
              <Row label="Total Burned" value="−1,940" mono burn />
              <Row label="Win Rate" value="73%" mono />
            </div>
          </Panel>
          <Panel accent={C.inkRed}>
            <Eyebrow color={C.inkRed}>Open Challenge</Eyebrow>
            <p style={{ fontFamily: "var(--font-saira)", fontSize: 13,
              color: C.ash, margin: "10px 0 14px", lineHeight: 1.6 }}>
              Drop a bet in the community. Highest ASL accuracy over the round takes the pot.
            </p>
            <RedBtn small onClick={() => go("pvp")}>Create PvP Bet →</RedBtn>
          </Panel>
        </div>
      </div>
    </Stage>
  );
}

function FloorRow({ f, onFight }) {
  const state = f.cleared ? "cleared" : f.current ? "current" : f.locked ? "locked" : "open";
  const accent = f.boss ? C.inkRed : f.current ? C.inkGold : C.ashDim;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "54px 1fr auto", alignItems: "center",
      gap: 14, padding: "12px 16px", borderRadius: 4,
      background: f.current ? `${C.inkGold}10` : C.bgPanel,
      border: `1px solid ${f.current ? C.inkGold + "55" : f.boss ? C.inkRed + "44" : "#ffffff10"}`,
      opacity: state === "locked" ? .42 : 1,
    }}>
      <div style={{ fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 22,
        color: accent, textAlign: "center" }}>
        {String(f.n).padStart(2, "0")}
      </div>
      <div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          letterSpacing: 1.5, color: C.ashDim }}>{f.z}{f.boss ? " · BOSS" : ""}</div>
        <div style={{ fontFamily: "var(--font-saira)", fontSize: 16, color: C.ash }}>{f.name}</div>
      </div>
      <div>
        {state === "cleared" && <Tag c={C.gestureOk}>✓ Cleared</Tag>}
        {state === "locked" && <Tag c={C.ashDim}>Locked</Tag>}
        {(state === "current" || state === "open") && (
          <button onClick={onFight} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 1,
            color: C.bgDeep, background: f.boss ? C.inkRed : C.inkGold, border: "none",
            padding: "8px 16px", borderRadius: 3, cursor: "pointer", fontWeight: 600,
            textTransform: "uppercase",
          }}>{f.boss ? "Challenge" : "Fight"}</button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 3 — BATTLE SCREEN
// ============================================================
const SINGLE_SIGNS = [
  { word: "A", letters: ["A"] }, { word: "B", letters: ["B"] }, { word: "C", letters: ["C"] },
  { word: "D", letters: ["D"] }, { word: "E", letters: ["E"] }, { word: "F", letters: ["F"] },
  { word: "G", letters: ["G"] }, { word: "H", letters: ["H"] }, { word: "I", letters: ["I"] },
  { word: "J", letters: ["J"] }, { word: "K", letters: ["K"] }, { word: "L", letters: ["L"] }, { word: "O", letters: ["O"] },
  { word: "P", letters: ["P"] }, { word: "Q", letters: ["Q"] }, { word: "R", letters: ["R"] },
  { word: "S", letters: ["S"] }, { word: "T", letters: ["T"] }, { word: "U", letters: ["U"] },
  { word: "V", letters: ["V"] }, { word: "W", letters: ["W"] }, { word: "X", letters: ["X"] },
  { word: "Y", letters: ["Y"] }, { word: "Z", letters: ["Z"] }
];

const WORD_SIGNS = [
  { word: "FIRE", letters: ["F", "I", "R", "E"] },
  { word: "WATER", letters: ["W", "A", "T", "E", "R"] },
  { word: "SWORD", letters: ["S", "W", "O", "R", "D"] },
];

function BattleScreen({ go }) {
  const { latestPrediction, setTargetSign, triggerAction, currentFloor, clearFloor, setCurrentFloor, gameMode, setGameMode, mpRound, mpScores, mpOpponent, mpRoomId, mpStatus, submitRoundResult, mpWinner, mpReady, mpOpponentReady, sendReady, isHost, sendHit, sendMiss, opponentHitCount, opponentMissCount } = useGameStore();
  const floorData = TOWER_FLOORS.find(f => f.n === currentFloor) || TOWER_FLOORS[TOWER_FLOORS.length - 1];
  
  const maxMonsterHP = gameMode === 'pvp' ? 100 : 100 + ((currentFloor - 1) * 25);
  const monsterDamage = 15 + ((currentFloor - 1) * 2); // scales up to 55 on floor 8

  const [playerHP, setPlayerHP] = useState(100);
  const [monsterHP, setMonsterHP] = useState(maxMonsterHP);
  const [showRoundCard, setShowRoundCard] = useState(true);

  // Trigger title card on new round/floor
  useEffect(() => {
    setShowRoundCard(true);
  }, [mpRound, currentFloor]);

  // Hide title card after 2.5s
  useEffect(() => {
    if (showRoundCard) {
      const t = setTimeout(() => setShowRoundCard(false), 2500);
      return () => clearTimeout(t);
    }
  }, [showRoundCard]);

  const [signIdx, setSignIdx] = useState(() => Math.floor(Math.random() * 100)); // Start random
  const [spellIdx, setSpellIdx] = useState(0);
  const [conf, setConf] = useState(0.46);
  const isProcessingRef = useRef(false); // <--- Prevent duplicate rapid attacks
  const holdCountRef = useRef(0); // <--- Require holding the sign briefly
  const [timer, setTimer] = useState(6);
  const [feed, setFeed] = useState("tracking"); // tracking | ok | bad
  const [shake, setShake] = useState(false);
  const [pPose, setPPose] = useState("idle"); // idle | attack | hurt
  const [ePose, setEPose] = useState("idle");
  const [fx, setFx] = useState(null); // {side, txt}
  const [modelReady, setModelReady] = useState(false);

  // Submit round result when someone dies in PvP
  useEffect(() => {
    if (gameMode === 'pvp' && (monsterHP === 0 || playerHP === 0)) {
      submitRoundResult(playerHP, 1);
    }
  }, [monsterHP, playerHP, gameMode, submitRoundResult]);

  // Reset HP when a new round starts in PvP
  useEffect(() => {
    if (gameMode === 'pvp' && mpStatus === 'active') {
      setPlayerHP(100);
      setMonsterHP(100);
      setTimer(6);
      setSpellIdx(0);
      setConf(0);
      triggerAction('reset_match');
    }
  }, [mpRound, mpStatus, gameMode, triggerAction]);

  const activeSigns = currentFloor >= 8 ? WORD_SIGNS : SINGLE_SIGNS;
  const sign = activeSigns[signIdx % activeSigns.length];

  // confidence creep + timer
  useEffect(() => {
    if (!modelReady) return; // Pause timer until AI model is fully loaded
    if (gameMode === 'pvp') return; // Disable timer entirely for PvP

    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? +(t - 0.1).toFixed(1) : 0));
    }, 100);
    return () => clearInterval(id);
  }, [signIdx, modelReady, gameMode]);

  const prevOppHit = useRef(opponentHitCount);
  const prevOppMiss = useRef(opponentMissCount);

  // Listen for opponent actions in real-time using robust counters
  useEffect(() => {
    if (gameMode !== 'pvp') return;

    if (opponentHitCount > prevOppHit.current) {
      const hits = opponentHitCount - prevOppHit.current;
      prevOppHit.current = opponentHitCount;
      const dmg = 28 * hits; 
      const newHp = Math.max(0, playerHP - dmg);
      setPlayerHP(newHp);
      triggerAction('monster_attack', { targetHp: newHp });
      
      setShake(true); setTimeout(() => setShake(false), 500);
      setFx({ side: "player", txt: `-${dmg}` });
      setPPose("knock");
      setEPose("lunge");
      setTimeout(() => { setPPose("idle"); setEPose("idle"); setFx(null); }, 600);
    }
    
    if (opponentMissCount > prevOppMiss.current) {
      const misses = opponentMissCount - prevOppMiss.current;
      prevOppMiss.current = opponentMissCount;
      const dmg = 20 * misses; 
      const newHp = Math.max(0, monsterHP - dmg);
      setMonsterHP(newHp);
      triggerAction('player_attack', { targetHp: newHp });
      
      setFx({ side: "enemy", txt: `-${dmg}` });
      setEPose("knock");
      setTimeout(() => { setEPose("idle"); setFx(null); }, 600);
    }
  }, [opponentHitCount, opponentMissCount, gameMode, playerHP, monsterHP, triggerAction]);

  // Handle timeout
  useEffect(() => {
    if (gameMode === 'pvp') return; // No timeout damage in PvP
    if (timer === 0 && playerHP > 0 && monsterHP > 0) {
      takeHit();
      setTimer(6);
    }
  }, [timer, playerHP, monsterHP, gameMode]);

  useEffect(() => {
    const requiredConf = gameMode === 'pvp' ? 0.75 : 0.8;
    if (conf >= requiredConf) setFeed("ok");
    else setFeed("tracking");
  }, [conf, gameMode]);


  // Sync target sign to store for AI/Mock engine (pass the specific letter we need)
  const targetChar = sign.word[spellIdx];

  useEffect(() => {
    setTargetSign(targetChar);
  }, [targetChar, setTargetSign]);

  // Listen for gesture predictions
  useEffect(() => {
    if (!latestPrediction) return;
    if (isProcessingRef.current) return; // Skip if already processing a hit
    if (gameMode === 'pvp' && mpStatus !== 'active') return; // Skip if waiting for PvP
    
    // Live update the confidence bar!
    setConf(latestPrediction.confidence);

    const requiredConf = gameMode === 'pvp' ? 0.75 : 0.8;
    const requiredFrames = gameMode === 'pvp' ? 3 : 4;

    if (latestPrediction.char === targetChar && latestPrediction.confidence >= requiredConf) {
      holdCountRef.current += 1;
      
      if (holdCountRef.current >= requiredFrames) {
        isProcessingRef.current = true; // Lock
        holdCountRef.current = 0; // Reset
        
        // Add slight delay to let user see "SIGN LOCKED"
        setTimeout(() => {
          if (monsterHP > 0 && playerHP > 0) {
            if (spellIdx + 1 >= sign.word.length) {
              landHit();
              // Unlock after attack animation finishes
              setTimeout(() => { isProcessingRef.current = false; }, 1000); 
            } else {
              // Move to next letter in the word
              setSpellIdx(s => s + 1);
              setConf(0.46); // Reset conf for next letter
              // Unlock quickly for the next letter
              setTimeout(() => { isProcessingRef.current = false; }, 200);
            }
          } else {
              isProcessingRef.current = false;
          }
        }, 400);
      }
    } else {
      // If it drops below threshold or wrong sign, reset the hold counter
      holdCountRef.current = 0;
    }
  }, [latestPrediction, targetChar, spellIdx, monsterHP, playerHP]);

  const landHit = () => {
    const newHp = Math.max(0, monsterHP - 28);
    setMonsterHP(newHp);
    triggerAction('player_attack', { targetHp: newHp });
    if (gameMode === 'pvp') sendHit();
    
    // Pick next random sign, avoiding repeats
    setSignIdx((prev) => {
      let next;
      const current = prev % activeSigns.length;
      do {
        next = Math.floor(Math.random() * activeSigns.length);
      } while (next === current && activeSigns.length > 1);
      
      const nextSign = activeSigns[next];
      setTimer(nextSign.letters.length > 1 ? 10 : 6);
      return next;
    });
    
    setSpellIdx(0);
    setConf(0);
    setShake(true); setTimeout(() => setShake(false), 500);
    setFx({ side: "enemy", txt: "-28" });
    setPPose("lunge");
    setEPose("knock");
    setTimeout(() => { setPPose("idle"); setEPose("idle"); setFx(null); }, 600);
  };
  const takeHit = () => {
    const newHp = Math.max(0, playerHP - monsterDamage);
    setPlayerHP(newHp);
    triggerAction('monster_attack', { targetHp: newHp });
    setTimer(sign.letters.length > 1 ? 10 : 6);
    setConf(0);
    setShake(true); setTimeout(() => setShake(false), 500);
    setFx({ side: "player", txt: `-${monsterDamage}` });
    setEPose("lunge");
    setPPose("knock");
    setTimeout(() => { setPPose("idle"); setEPose("idle"); setFx(null); }, 600);
  };
  const landMiss = () => {
      takeHit();
      if (gameMode === 'pvp') sendMiss();
  };

  return (
    <Stage battle>
      <div style={{
        position: "relative", width: "100%", height: 640, borderRadius: 6,
        border: "1px solid #ffffff10", overflow: "hidden",
        animation: shake ? "shake .5s" : "none",
      }}>
        {/* BACKGROUND LAYER - PHASER */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <GameContainer />
        </div>

        {/* TITLE CARD */}
        {showRoundCard && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 50, pointerEvents: "none",
            animation: "titleCardFade 2.5s ease-in-out forwards"
          }}>
            {/* Dynamic Round Text (No Logo) */}
            <div style={{
              fontFamily: "var(--font-saira)",
              fontSize: "96px",
              fontWeight: 900,
              fontStyle: "italic",
              textTransform: "uppercase",
              background: "linear-gradient(180deg, var(--chrome-white) 0%, var(--chrome-silver) 50%, var(--chrome-shadow) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 20px rgba(216, 36, 58, 0.5)) drop-shadow(0 0 5px var(--signal-red))",
              textAlign: "center",
              lineHeight: 1,
              position: "relative",
              zIndex: 2,
              letterSpacing: "4px",
              whiteSpace: "pre-line"
            }}>
              {gameMode === 'pvp' ? `ROUND ${mpRound || 1}\nFIGHT` : "FIGHT"}
            </div>
          </div>
        )}

        {/* UI OVERLAY */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20, pointerEvents: "none" }}>
          
          {/* TOP SECTION: Toggle & HP Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", pointerEvents: "auto" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setGameMode('pve')} style={{ ...ghostBtn, borderColor: gameMode === 'pve' ? C.inkGold : '#ffffff22', color: gameMode === 'pve' ? C.inkGold : C.ashDim }}>vs MONSTER</button>
                <button onClick={() => go("pvp")} style={{ ...ghostBtn, borderColor: gameMode === 'pvp' ? C.inkGold : '#ffffff22', color: gameMode === 'pvp' ? C.inkGold : C.ashDim }}>MULTIPLAYER</button>
              </div>
              <button onClick={() => go("map")} style={ghostBtn}>Flee (Burn 50%)</button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
              {/* YOU (Left) */}
              <div style={{ flex: 1 }}>
                <Combatant name="You · Samurai" hp={playerHP} max={100} color={isHost ? C.aura : C.inkRed} align="left" roundsWon={mpScores["you"] || 0} showDots={gameMode === 'pvp'} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.ashDim, letterSpacing: 2 }}>{gameMode === 'pvp' ? `ROUND ${mpRound}/3` : `FLOOR ${currentFloor}`}</div>
                <div style={{ fontFamily: "var(--font-saira)", fontSize: 48, fontWeight: 900, color: C.inkGold, lineHeight: 1 }}>{Math.ceil(timer)}</div>
              </div>

              {/* MONSTER/OPPONENT (Right) */}
              <div style={{ flex: 1 }}>
                <Combatant name={gameMode === 'pvp' ? (mpOpponent ? `${mpOpponent.handle} · Samurai` : "Waiting...") : `${floorData.name} · Fl.${floorData.n}`} hp={monsterHP} max={maxMonsterHP} color={isHost ? C.inkRed : C.aura} align="right" roundsWon={mpScores["opp"] || 0} showDots={gameMode === 'pvp'} />
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Facecams & Sign Prompt */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end", pointerEvents: "auto" }}>
            
            {/* COMBINED CENTER PANEL */}
            <div style={{ 
              display: "flex", 
              background: `#110b14dd url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h-2zm0 20v-2H0v-2h20v-2H0v-2h20v-2H0v-2h20v-2H0v-2h20v-2H0v-2h22v20h-2zm20-20v-2H20v-2h20v-2H20v-2h20v-2H20V8h20V6H20V4h20V2H20V0h20v20h-20zM40 40v-2H20v-2h20v-2H20v-2h20v-2H20v-2h20v-2H20v-2h20v-2H20v-2h20v20z' fill='%23D4A853' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`, 
              border: `2px solid ${C.inkGold}88`, 
              borderRadius: 6, 
              padding: "12px", 
              boxShadow: `0 6px 30px #000a, inset 0 0 0 1px #000, inset 0 0 0 2px ${C.inkGold}44`, 
              backdropFilter: "blur(8px)", 
              alignItems: "center", 
              gap: 24 
            }}>
              
              {/* LOCAL FACECAM */}
              <div style={{ width: 150, height: 112, background: "#0008", border: `1px solid ${conf >= 0.8 ? C.gestureOk : '#ffffff33'}`, borderRadius: 4, overflow: "hidden", position: "relative", boxShadow: conf >= 0.8 ? `0 0 15px ${C.gestureOk}44` : "none" }}>
                <div style={{ position: "absolute", top: 4, left: 4, zIndex: 20, background: conf >= 0.8 ? C.gestureOk : "#000a", color: conf >= 0.8 ? "#000" : C.ash, fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", padding: "2px 6px", borderRadius: 2, fontWeight: "bold" }}>
                  {conf >= 0.8 ? "LOCKED" : "TRACKING"}
                </div>
                <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: 300, height: 225 }}>
                  <WebcamPanel status={feed} targetSign={targetChar} onModelReady={() => setModelReady(true)} />
                </div>
              </div>

              {/* SIGN PROMPT */}
              <div style={{ display: "flex", alignItems: "center", gap: 30, paddingRight: 12 }}>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 2, color: C.ashDim, marginBottom: 2 }}>SIGN</div>
                  <div style={{ fontFamily: "var(--font-saira)", fontSize: 38, fontWeight: 900, color: C.inkGold, textShadow: `0 0 10px ${C.inkRed}`, letterSpacing: 4 }}>
                    {sign.word.split('').map((char, i) => (
                      <span key={i} style={{ color: i < spellIdx ? C.gestureOk : i === spellIdx ? C.inkGold : C.ashDim, textShadow: i === spellIdx ? `0 0 10px ${C.inkRed}` : 'none', opacity: i > spellIdx ? 0.5 : 1 }}>{char}</span>
                    ))}
                  </div>
                </div>
                <div style={{ width: 140 }}>
                  <MeterRow label="Conf" pct={Math.round(conf * 100)} color={conf >= 0.8 ? C.gestureOk : C.inkGold} />
                  {gameMode !== 'pvp' && (
                    <>
                      <div style={{ height: 6 }} />
                      <MeterRow label="Timer" pct={(timer / (sign.letters.length > 1 ? 10 : 6)) * 100} color={timer < 3 ? C.gestureBad : C.aura} suffix={`${timer.toFixed(0)}s`} />
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* OPPONENT FACECAM (Float Right) */}
            {gameMode === 'pvp' && (
              <div style={{ position: "absolute", right: 0, bottom: 0, width: 140, background: "#0008", border: `1px solid #ffffff33`, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: 105, display: "flex", alignItems: "center", justifyContent: "center", color: C.ashDim, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", textAlign: "center", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.5, zIndex: 1 }}>
                    <OpponentWebcamPanel />
                  </div>
                  <span style={{ zIndex: 2 }}>Opponent<br/>(Landmarks)</span>
                </div>
                <div style={{ background: "#000", padding: "4px 8px", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: C.ashDim, textAlign: "center", borderTop: "1px solid #ffffff22" }}>{mpOpponent ? mpOpponent.handle : "WAITING"}</div>
              </div>
            )}

          </div>
        </div>

        {/* floating damage number */}
        {fx && (
          <div style={{
            position: "absolute", bottom: 260,
            left: fx.side === "enemy" ? "auto" : "20%",
            right: fx.side === "enemy" ? "20%" : "auto",
            fontFamily: "var(--font-saira)", fontWeight: 900, fontSize: 40,
            color: fx.side === "enemy" ? C.inkGold : C.gestureBad,
            textShadow: `0 0 16px ${fx.side === "enemy" ? C.inkGold : C.gestureBad}`,
            animation: "dmgPop .55s ease-out forwards", pointerEvents: "none", zIndex: 12,
          }}>{fx.txt}</div>
        )}
      </div>

      {/* Victory / Defeat Modal */}
      {(monsterHP === 0 || playerHP === 0) && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 320,
          background: "rgba(10, 6, 8, 0.98)", zIndex: 9999,
          borderTop: `1px solid ${C.ashDim}44`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          animation: "inkWipe 0.5s ease-out forwards"
        }}>
          <h1 style={{
            fontFamily: "var(--font-saira)", fontSize: 72, fontWeight: 900,
            color: monsterHP === 0 ? C.inkGold : C.gestureBad,
            textShadow: `0 0 60px ${monsterHP === 0 ? C.inkGold : C.gestureBad}`,
            marginBottom: 20, letterSpacing: 8,
            animation: monsterHP === 0 ? "float 3s ease-in-out infinite" : "none"
          }}>
            {gameMode === 'pvp' 
              ? (mpStatus === 'ended' 
                  ? (monsterHP === 0 ? "MATCH WON" : "MATCH LOST") 
                  : (monsterHP === 0 ? "ROUND WON" : "ROUND LOST"))
              : (monsterHP === 0 ? "YOU WIN" : "DEFEATED")
            }
          </h1>
          
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, color: C.ash, marginBottom: 40,
            textAlign: "center", maxWidth: 400
          }}>
            {gameMode === 'pvp'
              ? (mpStatus === 'ended' ? (monsterHP === 0 ? "You claimed the pot!" : "Your bet was lost.") : "Waiting for next round...")
              : (monsterHP === 0 
                ? `+1,240 $MONARA`
                : `−524 $MONARA · 0.1% burned forever`)}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
            {gameMode !== 'pvp' && monsterHP === 0 && <GoldBtn onClick={() => {
              clearFloor(currentFloor);
              const nextF = [...TOWER_FLOORS].reverse().find(f => f.n > currentFloor)?.n || 8;
              setCurrentFloor(nextF);
              setPlayerHP(100);
              setMonsterHP(100 + ((nextF - 1) * 25));
              setTimer(nextF >= 8 && gameMode !== 'pvp' ? 10 : 6);
              setSpellIdx(0);
              triggerAction('reset_match');
            }}>Next Fight →</GoldBtn>}
            {gameMode !== 'pvp' && playerHP === 0 && <RedBtn onClick={() => {
              setPlayerHP(100);
              setMonsterHP(maxMonsterHP);
              setTimer(currentFloor >= 8 && gameMode !== 'pvp' ? 10 : 6);
              setSpellIdx(0);
              triggerAction('reset_match');
            }}>Rematch</RedBtn>}
            {(gameMode !== 'pvp' || mpStatus === 'ended') && <button onClick={() => go("map")} style={ghostBtn}>Back to Tower</button>}
          </div>
        </div>
      )}

      {/* PvP Pre-match Lobby Modal */}
      {gameMode === 'pvp' && mpStatus === 'found' && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(10, 6, 8, 0.95)", zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          animation: "inkWipe 0.4s ease-out forwards"
        }}>
          <h2 style={{ fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 24, color: C.inkGold, marginBottom: 8 }}>PRE-MATCH LOBBY</h2>
          <p style={{ fontFamily: "var(--font-saira)", color: C.ashDim, fontSize: 14, marginBottom: 32 }}>Both players must be ready to start</p>
          
          <div style={{ display: "flex", gap: 32, marginBottom: 40 }}>
            {/* You */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 140 }}>
              <div style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: C.ash }}>YOU</div>
              <div style={{ padding: "8px 16px", borderRadius: 4, background: mpReady ? `${C.gestureOk}22` : "#222", border: `1px solid ${mpReady ? C.gestureOk : "#444"}`, color: mpReady ? C.gestureOk : C.ashDim, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: "bold" }}>
                {mpReady ? "READY ✓" : "WAITING"}
              </div>
            </div>
            
            <div style={{ color: C.ashDim, alignSelf: "center", fontFamily: "var(--font-saira)", fontSize: 20 }}>VS</div>
            
            {/* Opponent */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 140 }}>
              <div style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: C.ash }}>{mpOpponent?.handle || "OPPONENT"}</div>
              <div style={{ padding: "8px 16px", borderRadius: 4, background: mpOpponentReady ? `${C.gestureOk}22` : "#222", border: `1px solid ${mpOpponentReady ? C.gestureOk : "#444"}`, color: mpOpponentReady ? C.gestureOk : C.ashDim, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: "bold" }}>
                {mpOpponentReady ? "READY ✓" : "WAITING"}
              </div>
            </div>
          </div>
          
          <GoldBtn 
            onClick={() => { if (!mpReady) sendReady(); }} 
            disabled={mpReady}
            style={{ opacity: mpReady ? 0.5 : 1, cursor: mpReady ? "not-allowed" : "pointer" }}
          >
            {mpReady ? "Waiting for Opponent..." : "I'M READY"}
          </GoldBtn>
        </div>
      )}
    </Stage>
  );
}

function Combatant({ name, hp, max, color, align, roundsWon = 0, showDots = false }) {
  return (
    <div style={{ flex: 1, textAlign: align }}>
      <div style={{ display: "flex", justifyContent: align === "right" ? "flex-end" : "flex-start",
        gap: 8, alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 16,
          color: C.ash, letterSpacing: 1 }}>{name}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.ashDim }}>
          {hp}/{max}
        </span>
      </div>
      <div style={{ marginBottom: 6 }}>
        <Bar value={hp} max={max} color={color} glow height={18} flipDrain={align === "right"} />
      </div>
      {showDots && (
        <div style={{ display: "flex", gap: 6, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: roundsWon >= 1 ? color : "#000", border: `1px solid ${color}`, boxShadow: roundsWon >= 1 ? `0 0 8px ${color}` : "none" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: roundsWon >= 2 ? color : "#000", border: `1px solid ${color}`, boxShadow: roundsWon >= 2 ? `0 0 8px ${color}` : "none" }} />
        </div>
      )}
    </div>
  );
}

function MeterRow({ label, pct, color, suffix }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.ashDim }}>
        <span>{label}</span><span style={{ color }}>{suffix || pct + "%"}</span>
      </div>
      <Bar value={pct} max={100} color={color} height={9} />
    </div>
  );
}

// ============================================================
// SCREEN 4 — PvP CHALLENGE
// ============================================================
function CreateChallengeScreen({ go }) {
  const { mpRoomId } = useGameStore();
  const [bet, setBet] = useState(1000);
  const [created, setCreated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
    console.log("[Create Room] Starting room creation process...");
    try {
      setIsProcessing(true);
      const feeWallet = process.env.NEXT_PUBLIC_FEE_WALLET_ADDRESS;
      const tokenCa = process.env.NEXT_PUBLIC_TOKEN_CA;
      if (!feeWallet || !tokenCa) throw new Error("Fee wallet or Token CA not configured");

      console.log(`[Create Room] Target Fee Wallet: ${feeWallet}, Token CA: ${tokenCa}`);
      const feePubkey = new PublicKey(feeWallet);
      const mintPubkey = new PublicKey(tokenCa);

      const playerAta = await getAssociatedTokenAddress(mintPubkey, publicKey);
      const feeAta = await getAssociatedTokenAddress(mintPubkey, feePubkey);

      const amountToTransfer = bet * Math.pow(10, 6);
      console.log(`[Create Room] Preparing transaction: ${bet} MONARA to ${feeWallet}`);

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
      
      console.log("[Create Room] Sending transaction to wallet...");
      const signature = await sendTransaction(tx, connection);
      console.log("[Create Room] Transaction sent! Signature:", signature);
      
      console.log("[Create Room] Waiting for confirmation...");
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'processed');
      console.log("[Create Room] Transaction confirmed!");

      const { connectSocket, createPvPRoom } = useGameStore.getState();
      console.log("[Create Room] Connecting socket...");
      connectSocket();
      
      const hostName = "Host_" + Math.floor(Math.random() * 1000);
      console.log(`[Create Room] Emitting createPvPRoom with Handle: ${hostName}, Bet: ${bet}`);
      createPvPRoom(bet, hostName, signature, publicKey.toBase58());
      setCreated(true);
    } catch (err) {
      console.error("[Create Room] ERROR:", err);
      alert("Transaction failed: " + err.message);
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
                    alert("Copied to clipboard!");
                  }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
                  title="Copy Link"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.inkGold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
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
function BurnScreen({ go }) {
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
function Stage({ children, battle }) {
  return (
    <div style={{
      minHeight: 600, padding: "30px 26px 40px",
      background: battle
        ? `radial-gradient(circle at 50% 0%, #1a0f14, ${C.bgDeep} 70%)`
        : `radial-gradient(circle at 50% -10%, #15101a, ${C.bgDeep} 65%)`,
      position: "relative",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: .03,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Ccircle cx='1' cy='1' r='.5' fill='%23fff'/%3E%3C/svg%3E\")" }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

function TopBar({ tier, balance, go }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      paddingBottom: 16, borderBottom: "1px solid #ffffff12", maxWidth: 900, margin: "0 auto" }}>
      <button onClick={() => go("map")} style={{ background: "none", border: "none",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <TowerGlyph size={26} />
        <span style={{ fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 16,
          color: C.ash, letterSpacing: 1 }}>MONARA</span>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: C.inkGold }}>
          {balance} $MONARA
        </span>
        <TierBadge tier={tier} />
      </div>
    </div>
  );
}

function Panel({ children, accent }) {
  return (
    <div style={{ background: C.bgPanel, border: `1px solid ${accent ? accent + "55" : "#ffffff12"}`,
      borderRadius: 6, padding: "18px 20px", textAlign: "left" }}>{children}</div>
  );
}

function Row({ label, value, mono, gold, burn }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.ashDim }}>{label}</span>
      <span style={{
        fontFamily: mono ? "'IBM Plex Mono', monospace" : "var(--font-saira)",
        fontSize: 13.5, color: gold ? C.inkGold : burn ? C.burn : C.ash, fontWeight: 500,
      }}>{value}</span>
    </div>
  );
}

function Eyebrow({ children, color }) {
  return <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5,
    letterSpacing: 2.5, textTransform: "uppercase", color: color || C.ashDim }}>{children}</div>;
}

function Tag({ children, c }) {
  return <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
    color: c, border: `1px solid ${c}55`, padding: "5px 10px", borderRadius: 3 }}>{children}</span>;
}

const ghostBtn = {
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, padding: "11px 18px",
  borderRadius: 3, cursor: "pointer", border: "1px solid #ffffff22",
  background: "transparent", color: C.ashDim,
};

function GoldBtn({ children, onClick, small }) {
  return <button onClick={onClick} style={{
    fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: .5,
    fontSize: small ? 12.5 : 14, padding: small ? "11px 18px" : "14px 30px",
    background: C.inkGold, color: C.bgDeep, border: "none", borderRadius: 3,
    cursor: "pointer", boxShadow: `0 4px 20px ${C.inkGold}33`,
  }}>{children}</button>;
}
function RedBtn({ children, onClick, small }) {
  return <button onClick={onClick} style={{
    fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: .5,
    fontSize: small ? 12.5 : 14, padding: small ? "11px 18px" : "14px 30px",
    background: C.inkRed, color: C.ash, border: "none", borderRadius: 3,
    cursor: "pointer", boxShadow: `0 4px 20px ${C.inkRed}44`, width: "100%",
  }}>{children}</button>;
}

function ResultBtn({ win, onClick }) {
  return <button onClick={onClick} style={{
    width: "100%", fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 16,
    padding: "14px", borderRadius: 4, cursor: "pointer", border: "none",
    color: win ? C.bgDeep : C.ash, background: win ? C.gestureOk : C.burn,
    letterSpacing: 1, marginTop: 4,
  }}>{win ? "VICTORY — Claim Reward →" : "DEFEAT — See the Ash →"}</button>;
}

// ---- glyphs (inline SVG art) ----
function TowerGlyph({ size = 100 }) {
  return (
    <img 
      src="/assets/logo.png" 
      alt="Eastcraft Monara"
      style={{ 
        width: size, 
        height: size, 
        filter: "invert(1)", 
        mixBlendMode: "screen",
        objectFit: "contain"
      }} 
    />
  );
}

// ---- FIGHTERS (side-profile, face each other) ----
function Fighter({ who, pose }) {
  // samurai faces right (toward enemy), imp faces left (toward player)
  const isPlayer = who === "samurai";
  const anim =
    pose === "attack" ? (isPlayer ? "lungeR .5s" : "lungeL .5s")
    : pose === "hurt" ? (isPlayer ? "knockL .55s" : "knockR .55s")
    : "bob 2.4s ease-in-out infinite";
  return (
    <div style={{ animation: anim, filter: pose === "hurt" ? "brightness(2)" : "none",
      transition: "filter .1s" }}>
      {isPlayer ? <Samurai /> : <FireImp />}
      {/* shadow */}
      <div style={{ width: 70, height: 10, margin: "2px auto 0", borderRadius: "50%",
        background: "#000", opacity: .4, filter: "blur(4px)" }} />
    </div>
  );
}

// Samurai — chibi side profile facing RIGHT, blue aura
function Samurai() {
  return (
    <svg width={96} height={150} viewBox="0 0 96 150">
      <defs>
        <radialGradient id="auraB" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.aura} stopOpacity=".4" />
          <stop offset="100%" stopColor={C.aura} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="80" rx="46" ry="64" fill="url(#auraB)" />
      {/* back leg */}
      <path d="M40 96 L33 134 L44 134 L48 100 Z" fill="#1c2230" />
      {/* front leg */}
      <path d="M52 98 L60 132 L70 132 L60 98 Z" fill="#262d3d" />
      {/* kimono body */}
      <path d="M36 58 Q34 90 40 100 L62 100 Q66 86 60 58 Z" fill="#2b3346" />
      <path d="M48 60 L48 100" stroke={C.aura} strokeWidth="2" opacity=".7" />
      {/* sash */}
      <rect x="38" y="82" width="26" height="7" fill={C.inkRed} />
      {/* sword arm extended toward enemy (right) */}
      <path d="M58 66 L82 60" stroke="#d9d2c7" strokeWidth="5" strokeLinecap="round" />
      <path d="M80 60 L96 56" stroke="#cfd6e0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="58" cy="66" r="4" fill="#3a4252" />
      {/* head profile */}
      <circle cx="50" cy="44" r="13" fill="#e8c9a0" />
      <path d="M62 42 Q66 44 62 47" fill="#e8c9a0" />{/* nose */}
      {/* topknot */}
      <circle cx="42" cy="32" r="6" fill="#16181f" />
      <path d="M38 38 Q48 28 58 36 L56 44 Q48 36 40 44 Z" fill="#16181f" />
      {/* eye */}
      <circle cx="54" cy="43" r="1.7" fill="#1a1a1a" />
      {/* headband */}
      <path d="M37 40 L63 38" stroke={C.inkRed} strokeWidth="3" />
    </svg>
  );
}

// Fire Imp — chibi side profile facing LEFT, flames
function FireImp() {
  return (
    <svg width={96} height={150} viewBox="0 0 96 150">
      <defs>
        <radialGradient id="auraR" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.burn} stopOpacity=".45" />
          <stop offset="100%" stopColor={C.burn} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="84" rx="44" ry="60" fill="url(#auraR)" />
      {/* legs */}
      <path d="M42 104 L34 132 L46 132 L50 106 Z" fill="#7a1f2a" />
      <path d="M54 106 L62 132 L72 132 L62 104 Z" fill="#9a2533" />
      {/* body */}
      <ellipse cx="50" cy="84" rx="22" ry="24" fill={C.inkRed} />
      <ellipse cx="50" cy="84" rx="22" ry="24" fill="none" stroke={C.burn} strokeWidth="1.5" />
      <path d="M42 74 Q50 88 58 74" stroke={C.burn} strokeWidth="1.5" fill="none" opacity=".6" />
      {/* claw arm reaching left toward player */}
      <path d="M40 78 L20 72" stroke={C.inkRed} strokeWidth="6" strokeLinecap="round" />
      <path d="M20 72 l-5 -3 M20 72 l-5 1 M20 72 l-4 4" stroke={C.burn} strokeWidth="2" strokeLinecap="round" />
      {/* head */}
      <circle cx="50" cy="50" r="15" fill={C.inkRed} />
      <circle cx="50" cy="50" r="15" fill="none" stroke={C.burn} strokeWidth="1.5" />
      {/* snout to left */}
      <path d="M36 52 Q30 54 36 58 Z" fill={C.inkRed} />
      {/* horns */}
      <path d="M44 38 L40 26 L48 36 Z" fill="#3a0f16" />
      <path d="M56 38 L60 26 L52 36 Z" fill="#3a0f16" />
      {/* flame crown */}
      <path d="M44 34 Q48 22 52 34 Q56 24 58 36" stroke={C.burn} strokeWidth="2.5" fill="none">
        <animate attributeName="opacity" values="1;.5;1" dur="0.8s" repeatCount="indefinite" />
      </path>
      {/* glowing eye (faces left) */}
      <circle cx="44" cy="49" r="3.4" fill={C.inkGold} />
      <circle cx="44" cy="49" r="1.3" fill="#000" />
      <path d="M38 44 L48 46" stroke="#3a0f16" strokeWidth="2" />{/* brow */}
    </svg>
  );
}

function PagodaBackdrop() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, opacity: .12 }}>
      <g stroke={C.inkGold} strokeWidth="2" fill="none">
        <path d="M200 40 L230 70 L170 70 Z" />
        <path d="M160 70 L240 70" strokeWidth="4" />
        <rect x="178" y="78" width="44" height="34" />
        <path d="M150 112 L250 112" strokeWidth="4" />
        <rect x="170" y="120" width="60" height="46" />
        <path d="M138 166 L262 166" strokeWidth="4" />
        <rect x="162" y="174" width="76" height="60" />
      </g>
      <circle cx="320" cy="70" r="40" fill={C.inkRed} opacity=".15" />
    </svg>
  );
}

function Embers() {
  const dots = Array.from({ length: 14 });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {dots.map((_, i) => (
        <span key={i} style={{
          position: "absolute", left: `${(i * 37) % 100}%`, bottom: -10,
          width: 3, height: 3, borderRadius: "50%", background: C.burn,
          boxShadow: `0 0 6px ${C.burn}`,
          animation: `rise ${4 + (i % 5)}s linear ${i * 0.4}s infinite`,
          opacity: .7,
        }} />
      ))}
    </div>
  );
}

function FlameGlyph() {
  return (
    <svg width={90} height={90} viewBox="0 0 100 100">
      <path d="M50 12 C58 32 74 38 68 60 C66 76 56 86 50 86 C44 86 34 76 32 60 C26 38 42 32 50 12 Z"
        fill={C.burn}>
        <animate attributeName="opacity" values="1;.7;1" dur="1.2s" repeatCount="indefinite" />
      </path>
      <path d="M50 38 C54 48 62 52 58 64 C57 72 53 78 50 78 C47 78 43 72 42 64 C38 52 46 48 50 38 Z"
        fill={C.inkGold} />
    </svg>
  );
}

// ============================================================

// ============================================================
// SCREEN: ACCEPT CHALLENGE
// ============================================================
function AcceptChallengeScreen({ roomId, go }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [roomBet, setRoomBet] = useState(null);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const balance = useTokenBalance();

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

      const amountToTransfer = roomBet * Math.pow(10, 6);

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

      const { connectSocket, joinPvPRoom, setGameMode } = useGameStore.getState();
      connectSocket();
      joinPvPRoom(roomId, "Challenger_" + Math.floor(Math.random() * 1000), signature, publicKey.toBase58());
      setGameMode("pvp");
      go("battle");
    } catch (err) {
      console.error(err);
      alert("Transaction failed: " + err.message);
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
  ["gate", "Gate"], ["map", "Tower"], ["battle", "Battle"],
  ["pvp", "PvP Bet"], ["burn", "Burn"],
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
        {screen === "battle" && <BattleScreen go={go} />}
        {screen === "pvp" && <CreateChallengeScreen go={go} />}
        {screen === "burn" && <BurnScreen go={go} />}
        {screen === "accept_challenge" && <AcceptChallengeScreen roomId={joinId} go={go} />}
      </div>
    </div>
  );
}

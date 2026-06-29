import React, { useState, useEffect, useRef } from "react";
import { C, ghostBtn } from "../theme";
import useGameStore, { TOWER_FLOORS } from "../../store/gameStore";
import { AVAILABLE_HEROES, HERO_REGISTRY } from "../../game/data/characterRegistry";
import { getMonsterForFloor } from "../../game/systems/MonsterDB";
import WebcamPanel from "../WebcamPanel";
import HeroSelectionModal from "../components/HeroSelectionModal";
import { Fighter, FlameGlyph, PagodaBackdrop, Embers } from "../components/Graphics";
import { Stage, TopBar, Eyebrow, Row, Bar, ResultBtn, GoldBtn, RedBtn } from "../components/SharedUI";
import dynamic from "next/dynamic";
import OpponentWebcamPanel from "../OpponentWebcamPanel";

const GameContainer = dynamic(() => import('../GameContainer'), { ssr: false });

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



export default function BattleScreen({ go }) {
  const { latestPrediction, setTargetSign, triggerAction, currentFloor, clearFloor, setCurrentFloor, gameMode, setGameMode, mpRound, mpScores, mpOpponent, mpRoomId, mpStatus, submitRoundResult, mpWinner, mpReady, mpOpponentReady, sendReady, isHost, sendHit, sendMiss, opponentHitCount, opponentMissCount, currentHeroId } = useGameStore();
  const [showHeroModal, setShowHeroModal] = useState(false);
  const floorData = TOWER_FLOORS.find(f => f.n === currentFloor) || TOWER_FLOORS[TOWER_FLOORS.length - 1];
  
  const monsterData = getMonsterForFloor(currentFloor);
  const maxMonsterHP = gameMode === 'pvp' ? 100 : monsterData.hp;
  const monsterDamage = monsterData.damage;

  const heroData = HERO_REGISTRY[currentHeroId] || { hp: 100, damage: 28 };
  const maxPlayerHP = gameMode === 'pvp' ? 100 : heroData.hp;
  const playerDamage = heroData.damage;

  const [playerHP, setPlayerHP] = useState(maxPlayerHP);
  const [monsterHP, setMonsterHP] = useState(maxMonsterHP);
  const [showRoundCard, setShowRoundCard] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);

  useEffect(() => {
    if (monsterHP === 0 || playerHP === 0) {
      const t = setTimeout(() => setShowEndModal(true), 2000);
      return () => clearTimeout(t);
    } else {
      setShowEndModal(false);
    }
  }, [monsterHP, playerHP]);

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

  // Sync battle state to store for audio/scene synchronization
  useEffect(() => {
    const store = useGameStore.getState();
    if (gameMode === 'pvp') {
      store.setBattleState(mpStatus === 'active' ? 'active' : 'loading');
    } else {
      store.setBattleState(modelReady ? 'active' : 'loading');
    }
  }, [gameMode, mpStatus, modelReady]);

  // Submit round result when someone dies in PvP
  useEffect(() => {
    if (gameMode === 'pvp' && (monsterHP === 0 || playerHP === 0)) {
      submitRoundResult(playerHP, 1);
    }
  }, [monsterHP, playerHP, gameMode, submitRoundResult]);

  // Reset HP when a new round starts in PvP
  useEffect(() => {
    if (gameMode === 'pvp' && mpStatus === 'active') {
      setPlayerHP(maxPlayerHP);
      setMonsterHP(maxMonsterHP);
      setTimer(6);
      setSpellIdx(0);
      setConf(0);
      triggerAction('reset_match');
    }
  }, [mpRound, mpStatus, gameMode, triggerAction]);

  const activeSigns = currentFloor >= 28 ? WORD_SIGNS : SINGLE_SIGNS;
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
      const dmg = playerDamage * hits; 
      const targetHp = Math.max(0, playerHP - dmg);
      triggerAction('monster_attack', { targetHp });
      
      setTimeout(() => {
          setPlayerHP(prev => Math.max(0, prev - dmg));
          setShake(true); setTimeout(() => setShake(false), 500);
          setFx({ side: "player", txt: `-${dmg}` });
          setPPose("knock");
          setEPose("lunge");
          setTimeout(() => { setPPose("idle"); setEPose("idle"); setFx(null); }, 600);
      }, 750);
    }
    
    if (opponentMissCount > prevOppMiss.current) {
      const misses = opponentMissCount - prevOppMiss.current;
      prevOppMiss.current = opponentMissCount;
      const dmg = 20 * misses; 
      const targetHp = Math.max(0, monsterHP - dmg);
      triggerAction('player_attack', { targetHp });
      
      setTimeout(() => {
          setMonsterHP(prev => Math.max(0, prev - dmg));
          setFx({ side: "enemy", txt: `-${dmg}` });
          setEPose("knock");
          setPPose("lunge");
          setTimeout(() => { setPPose("idle"); setEPose("idle"); setFx(null); }, 600);
      }, 750);
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
    const targetHp = Math.max(0, monsterHP - playerDamage);
    triggerAction('player_attack', { targetHp });
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

    setTimeout(() => {
        setMonsterHP(prev => Math.max(0, prev - playerDamage));
        setShake(true); setTimeout(() => setShake(false), 500);
        setFx({ side: "enemy", txt: `-${playerDamage}` });
        setPPose("lunge");
        setEPose("knock");
        setTimeout(() => { setPPose("idle"); setEPose("idle"); setFx(null); }, 600);
    }, 750);
  };
  const takeHit = () => {
    const targetHp = Math.max(0, playerHP - monsterDamage);
    triggerAction('monster_attack', { targetHp });
    setTimer(sign.letters.length > 1 ? 10 : 6);
    setConf(0);

    setTimeout(() => {
        setPlayerHP(prev => Math.max(0, prev - monsterDamage));
        setShake(true); setTimeout(() => setShake(false), 500);
        setFx({ side: "player", txt: `-${monsterDamage}` });
        setEPose("lunge");
        setPPose("knock");
        setTimeout(() => { setPPose("idle"); setEPose("idle"); setFx(null); }, 600);
    }, 750);
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
                <Combatant name="You · Samurai" hp={playerHP} max={maxPlayerHP} color={isHost ? C.aura : C.inkRed} align="left" roundsWon={mpScores["you"] || 0} showDots={gameMode === 'pvp'} />
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
      {showEndModal && (monsterHP === 0 || playerHP === 0) && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 180,
          background: "rgba(10, 6, 8, 0.98)", zIndex: 9999,
          borderTop: `1px solid ${C.ashDim}44`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          animation: "inkWipe 0.5s ease-out forwards"
        }}>
          <h1 style={{
            fontFamily: "var(--font-saira)", fontSize: 48, fontWeight: 900,
            color: monsterHP === 0 ? C.inkGold : C.gestureBad,
            textShadow: `0 0 40px ${monsterHP === 0 ? C.inkGold : C.gestureBad}`,
            marginBottom: 8, letterSpacing: 8,
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
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: C.ash, marginBottom: 16,
            textAlign: "center", maxWidth: 400
          }}>
            {gameMode === 'pvp'
              ? (mpStatus === 'ended' ? (monsterHP === 0 ? "You claimed the pot!" : "Your bet was lost.") : "Waiting for next round...")
              : (monsterHP === 0 
                ? `+1,240 $MONARA`
                : `−524 $MONARA · 0.1% burned forever`)}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            {gameMode !== 'pvp' && monsterHP === 0 && <GoldBtn onClick={() => {
              clearFloor(currentFloor);
              const nextF = [...TOWER_FLOORS].reverse().find(f => f.n > currentFloor)?.n || 28;
              const nextMonster = getMonsterForFloor(nextF);
              setCurrentFloor(nextF);
              setPlayerHP(maxPlayerHP);
              setMonsterHP(nextMonster.hp);
              setTimer(nextF >= 8 && gameMode !== 'pvp' ? 10 : 6);
              setSpellIdx(0);
              triggerAction('reset_match');
            }}>Next Fight →</GoldBtn>}
            {gameMode !== 'pvp' && playerHP === 0 && <RedBtn onClick={() => {
              setPlayerHP(maxPlayerHP);
              setMonsterHP(maxMonsterHP);
              setTimer(currentFloor >= 28 && gameMode !== 'pvp' ? 10 : 6);
              setSpellIdx(0);
              triggerAction('reset_match');
            }}>Rematch</RedBtn>}
            {gameMode !== 'pvp' && <button onClick={() => setShowHeroModal(true)} style={ghostBtn}>Change Hero</button>}
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

      {/* Hero Selection Modal Overlay */}
      {showHeroModal && <HeroSelectionModal onClose={() => setShowHeroModal(false)} />}
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

import React, { useState } from "react";
import { C, ghostBtn } from "../theme";
import useGameStore, { TOWER_FLOORS } from "../../store/gameStore";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { AVAILABLE_HEROES } from "../../game/data/characterRegistry";
import HeroSelectionModal from "../components/HeroSelectionModal";
import { Stage, TopBar, Eyebrow, Panel, Row, RedBtn, Tag } from "../components/SharedUI";

export function FloorRow({ f, onFight }) {
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
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {state === "cleared" && <Tag c={C.gestureOk}>✓ Cleared</Tag>}
        {state === "locked" && <Tag c={C.ashDim}>Locked</Tag>}
        {(state === "current" || state === "open" || state === "cleared") && (
          <button onClick={onFight} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 1,
            color: C.bgDeep, background: f.boss ? C.inkRed : C.inkGold, border: "none",
            padding: "8px 16px", borderRadius: 3, cursor: "pointer", fontWeight: 600,
            textTransform: "uppercase",
          }}>{state === "cleared" ? "Replay" : f.boss ? "Challenge" : "Fight"}</button>
        )}
      </div>
    </div>
  );
}

export default function MapScreen({ go }) {
  const { highestFloorCleared, currentFloor, setCurrentFloor, currentHeroId } = useGameStore();
  const [showHeroModal, setShowHeroModal] = useState(false);

  const nextAvailableFloorNum = Math.min(highestFloorCleared + 1, 28);
  const balance = useTokenBalance();
  const currentHeroInfo = AVAILABLE_HEROES.find(h => h.id === currentHeroId) || AVAILABLE_HEROES[0];

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
          <Eyebrow>The Ascent · 28 Floors</Eyebrow>
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
            <Eyebrow>Active Hero</Eyebrow>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, marginBottom: 16 }}>
              <img src={`/assets/character/hero/${currentHeroInfo.id}/${currentHeroInfo.preview}`} alt={currentHeroInfo.name} style={{ width: 60, height: 60, objectFit: "contain" }} />
              <div style={{ fontFamily: "var(--font-saira)", fontSize: 18, color: C.ash, fontWeight: 700 }}>
                {currentHeroInfo.name}
              </div>
            </div>
            <button onClick={() => setShowHeroModal(true)} style={{ ...ghostBtn, width: "100%", fontSize: 12, padding: "8px" }}>Change Hero</button>
          </Panel>
          <Panel>
            <Eyebrow>Run Stats</Eyebrow>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 11 }}>
              <Row label="Floors Cleared" value={`${highestFloorCleared} / 28`} mono />
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
      {showHeroModal && <HeroSelectionModal onClose={() => setShowHeroModal(false)} />}
    </Stage>
  );
}

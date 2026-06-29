import React from "react";
import { C, ghostBtn } from "../theme";
import { HERO_REGISTRY, AVAILABLE_HEROES } from "../../game/data/characterRegistry";
import { MONSTERS } from "../../game/systems/MonsterDB";
import { Stage, TopBar, Eyebrow, Row } from "../components/SharedUI";

export default function CodexScreen({ go }) {
  const heroes = AVAILABLE_HEROES.map(h => ({
    ...h,
    ...HERO_REGISTRY[h.id],
    imgPath: `/assets/character/hero/${h.id}/${h.preview}`
  }));

  const monsterPreviews = {
    centaur: "Preview.gif",
    Imp: "Preview.gif",
    gargoyle: "Preview.gif",
    goblin: "Preview.gif",
    witch: "Preview.png",
    masked_orc: "Preview.gif",
    stone_golem: "preview.gif",
    pyromancer: "Preview.gif",
    medusa: "Preview.gif",
    satyr_archer: "Preview.gif",
    minotaur: "Preview.gif",
    skeleton_mage: "Preview.gif",
    lizardman: "Preview.gif",
    kobold: "Preview.gif",
    gryphon: "preview.gif",
    dwarf: "Preview.gif",
    mimic: "Preview.gif",
    headless_horseman: "Preview.gif",
    huge_knight: "Preview.gif",
    harpy: "Preview.gif",
    flying_eye: "Preview.gif",
    baby_dragon: "Preview.gif",
    dragon: "Preview.gif",
    cerberus: "Preview.gif",
    cyclops: "preview.gif",
    demon_bos: "Preview.gif",
    poison_skull: "Preview.gif",
    skeleton_warrior: "Preview.gif",
    werewolf: "Preview.gif"
  };

  const monsters = Object.values(MONSTERS).map(m => ({
    id: m.spriteId,
    name: m.name,
    hp: m.hp,
    damage: m.damage,
    imgPath: `/assets/character/monster/${m.spriteId}/${monsterPreviews[m.spriteId]}`
  }));

  const renderCard = (char) => (
    <div key={char.id} style={{
      background: C.bgPanel, border: `1px solid #ffffff10`,
      borderRadius: 8, padding: "16px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12
    }}>
      <div style={{ 
        width: 150, height: 150, 
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: "rgba(0,0,0,0.2)", borderRadius: 8
      }}>
        <img src={char.imgPath} alt={char.name} style={{ width: "90%", height: "90%", objectFit: "contain" }} />
      </div>
      <div style={{ textAlign: "center", fontFamily: "var(--font-saira)" }}>
        <div style={{ color: C.ash, fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>{char.name}</div>
        <div style={{ color: C.ashDim, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>
          <span style={{ color: C.gestureOk }}>HP: {char.hp}</span>
          <span style={{ margin: "0 8px", color: "#555" }}>|</span>
          <span style={{ color: C.inkRed }}>DMG: {char.damage}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Stage>
      <TopBar>
        <button onClick={() => go("gate")} style={ghostBtn}>BACK</button>
        <Eyebrow>CHARACTER</Eyebrow>
        <div style={{ width: 60 }} />
      </TopBar>

      <div className="hero-scroll" style={{ width: "100%", maxHeight: "80vh", overflowY: "auto", padding: "10px 20px" }}>
        
        {/* HEROES SECTION */}
        <h2 style={{ fontFamily: "var(--font-saira)", color: C.inkGold, fontSize: 22, textAlign: "center", marginBottom: 20, marginTop: 10 }}>HEROES</h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, marginBottom: 40
        }}>
          {heroes.map(renderCard)}
        </div>

        {/* MONSTERS SECTION */}
        <h2 style={{ fontFamily: "var(--font-saira)", color: C.inkRed, fontSize: 22, textAlign: "center", marginBottom: 20 }}>MONSTERS</h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, marginBottom: 40
        }}>
          {monsters.map(renderCard)}
        </div>

      </div>
    </Stage>
  );
}

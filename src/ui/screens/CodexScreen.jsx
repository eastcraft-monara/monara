import React, { useState } from "react";
import { C, ghostBtn } from "../theme";
import { HERO_REGISTRY, AVAILABLE_HEROES, MONSTER_REGISTRY } from "../../game/data/characterRegistry";
import { MONSTERS } from "../../game/systems/MonsterDB";
import { Stage, TopBar, Eyebrow, Row } from "../components/SharedUI";
import { CharacterModal } from "../components/CharacterModal";

export default function CodexScreen({ go }) {
  const [selectedChar, setSelectedChar] = useState(null);

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

  const monsters = Object.values(MONSTERS).map(m => {
    const config = MONSTER_REGISTRY[m.spriteId] || {};
    return {
      ...config,
      id: m.spriteId,
      name: m.name,
      hp: m.hp,
      damage: m.damage,
      imgPath: `/assets/character/monster/${m.spriteId}/${monsterPreviews[m.spriteId]}`
    };
  });

  const allChars = [...heroes, ...monsters];
  const selectedIndex = selectedChar ? allChars.findIndex(c => c.id === selectedChar.id) : -1;

  const handlePrev = () => {
    if (selectedIndex > 0) setSelectedChar(allChars[selectedIndex - 1]);
    else setSelectedChar(allChars[allChars.length - 1]);
  };

  const handleNext = () => {
    if (selectedIndex < allChars.length - 1) setSelectedChar(allChars[selectedIndex + 1]);
    else setSelectedChar(allChars[0]);
  };

  const renderCard = (char) => (
    <div key={char.id} onClick={() => setSelectedChar(char)} style={{
      background: C.bgPanel, border: `1px solid #ffffff10`, cursor: "pointer",
      borderRadius: 8, padding: "16px", transition: "transform 0.2s ease, border-color 0.2s ease",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12
    }} 
    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = C.inkGold; }}
    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#ffffff10'; }}>
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

      {selectedChar && (
        <CharacterModal 
          char={selectedChar} 
          onClose={() => setSelectedChar(null)} 
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </Stage>
  );
}

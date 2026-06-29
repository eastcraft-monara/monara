import React from "react";
import useGameStore from '@/store/gameStore';
import { AVAILABLE_HEROES, HERO_REGISTRY } from '@/game/data/characterRegistry';
import { C, ghostBtn } from '../theme';

export default function HeroSelectionModal({ onClose }) {
  const { currentHeroId, setHero, triggerAction, currentScene } = useGameStore();
  
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,6,8,0.9)", zIndex: 10000,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "inkWipe 0.3s ease-out forwards"
    }}>
      <h2 style={{ fontFamily: "var(--font-saira)", fontSize: 28, color: C.ash, marginBottom: 32 }}>Select Hero</h2>
      <div className="hero-scroll" style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 20, width: "100%", maxWidth: 1000, maxHeight: "75vh", overflowY: "auto", padding: 20
      }}>
        {AVAILABLE_HEROES.map(hero => {
          const isSelected = hero.id === currentHeroId;
          const config = HERO_REGISTRY[hero.id] || { hp: 100, damage: 28 };
          return (
            <div key={hero.id} onClick={() => { 
              setHero(hero.id); 
              if (currentScene === 'battle') triggerAction('reset_match');
              onClose(); 
            }} style={{
              background: isSelected ? `${C.inkGold}22` : C.bgPanel,
              border: `2px solid ${isSelected ? C.inkGold : "#ffffff10"}`,
              borderRadius: 8, padding: "16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              transition: "all 0.2s"
            }}>
              <img src={`/assets/character/hero/${hero.id}/${hero.preview}`} alt={hero.name} style={{
                width: 150, height: 150, objectFit: "contain",
                filter: isSelected ? "drop-shadow(0 0 12px rgba(230,199,140,0.5))" : "none"
              }} />
              <div style={{ textAlign: "center", fontFamily: "var(--font-saira)" }}>
                <div style={{ color: C.ash, fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>{hero.name}</div>
                <div style={{ color: C.ashDim, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>
                  <span style={{ color: C.gestureOk }}>HP: {config.hp}</span>
                  <span style={{ margin: "0 8px", color: "#555" }}>|</span>
                  <span style={{ color: C.inkRed }}>DMG: {config.damage}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onClose} style={{ ...ghostBtn, marginTop: 32, fontSize: 14, padding: "10px 24px" }}>Cancel</button>
    </div>
  );
}

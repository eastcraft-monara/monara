import React, { useState, useEffect } from "react";
import { C, ghostBtn } from "../theme";

export const SpriteAnimator = ({ src, frameWidth, frameHeight, fps, scale }) => {
  const [frameCount, setFrameCount] = useState(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setFrameCount(Math.floor(img.width / frameWidth));
    };
    img.src = src;
  }, [src, frameWidth]);

  useEffect(() => {
    setFrame(0);
    if (frameCount <= 1) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frameCount);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [frameCount, fps, src]);

  return (
    <div style={{
      width: frameWidth,
      height: frameHeight,
      backgroundImage: `url(${src})`,
      backgroundPosition: `-${frame * frameWidth}px 0px`,
      transform: `scale(${scale * 1.5})`,
      imageRendering: "pixelated",
      backgroundRepeat: "no-repeat"
    }} />
  );
};

export const CharacterModal = ({ char, onClose, onPrev, onNext }) => {
  const [action, setAction] = useState("IDLE");

  // Reset action when char changes
  useEffect(() => {
    setAction("IDLE");
  }, [char.id]);

  // Determine available actions based on config
  const actions = ["IDLE", "RUN", "HURT", "DEATH"];
  for (let i = 1; i <= (char.attackCount || 1); i++) {
    actions.push(`ATTACK_${i}`);
  }
  if (char.hasShout) actions.push("SHOUT");

  // Get the FPS for the current action
  let fps = char.animFps?.idle || 8;
  if (action === "RUN") fps = char.animFps?.run || 12;
  if (action.startsWith("ATTACK")) fps = char.animFps?.attack || 12;
  if (action === "HURT") fps = char.animFps?.hurt || 12;
  if (action === "DEATH") fps = char.animFps?.death || 8;
  if (action === "SHOUT") fps = char.animFps?.shout || 8;

  const src = `${char.basePath}/${action}.png`;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.85)", zIndex: 10000,
      display: "flex", justifyContent: "center", alignItems: "center",
      backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      
      {/* FLOATING PREV BUTTON */}
      {onPrev && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{
          position: "absolute", left: 40, top: "50%", transform: "translateY(-50%)",
          background: "rgba(0,0,0,0.6)", border: `2px solid ${C.inkGold}`, borderRadius: "50%",
          width: 64, height: 64, display: "flex", justifyContent: "center", alignItems: "center",
          cursor: "pointer", color: C.inkGold, transition: "all 0.2s ease", zIndex: 10
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,215,0,0.2)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {/* FLOATING NEXT BUTTON */}
      {onNext && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{
          position: "absolute", right: 40, top: "50%", transform: "translateY(-50%)",
          background: "rgba(0,0,0,0.6)", border: `2px solid ${C.inkGold}`, borderRadius: "50%",
          width: 64, height: 64, display: "flex", justifyContent: "center", alignItems: "center",
          cursor: "pointer", color: C.inkGold, transition: "all 0.2s ease", zIndex: 10
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,215,0,0.2)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      <div style={{
        background: C.bgPanel, border: `1px solid ${C.inkGold}`, borderRadius: 12,
        padding: 30, display: "flex", gap: 40, minWidth: 600, minHeight: 400,
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)", position: "relative"
      }} onClick={e => e.stopPropagation()}>
        
        {/* Left side: Actions */}
        <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 style={{ color: C.ash, fontFamily: "var(--font-saira)", marginBottom: 10 }}>ACTIONS</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 300, paddingRight: 10 }} className="hero-scroll">
            {actions.map(act => (
              <button key={act} onClick={() => setAction(act)} style={{
                ...ghostBtn,
                borderColor: action === act ? C.inkGold : "#ffffff20",
                color: action === act ? C.inkGold : C.ashDim,
                background: action === act ? "rgba(255, 215, 0, 0.1)" : "transparent",
                textAlign: "left", padding: "10px 15px", justifyContent: "flex-start"
              }}>
                {act.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{...ghostBtn, borderColor: C.inkRed, color: C.inkRed, marginTop: 20}}>
            CLOSE
          </button>
        </div>

        {/* Right side: Sprite viewer */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 20,
          position: "relative", overflow: "hidden"
        }}>
          <h2 style={{ color: C.inkGold, fontFamily: "var(--font-saira)", position: "absolute", top: 20 }}>{char.name}</h2>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <SpriteAnimator 
              src={src} 
              frameWidth={char.frameWidth} 
              frameHeight={char.frameHeight} 
              fps={fps}
              scale={char.scale} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

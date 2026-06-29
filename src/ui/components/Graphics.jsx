import React from "react";
import { C } from "../theme";

export function TowerGlyph({ size = 100 }) {
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

export function Fighter({ who, pose }) {
  const isPlayer = who === "samurai";
  const anim =
    pose === "attack" ? (isPlayer ? "lungeR .5s" : "lungeL .5s")
    : pose === "hurt" ? (isPlayer ? "knockL .55s" : "knockR .55s")
    : "bob 2.4s ease-in-out infinite";
  return (
    <div style={{ animation: anim, filter: pose === "hurt" ? "brightness(2)" : "none",
      transition: "filter .1s" }}>
      {isPlayer ? <Samurai /> : <FireImp />}
      <div style={{ width: 70, height: 10, margin: "2px auto 0", borderRadius: "50%",
        background: "#000", opacity: .4, filter: "blur(4px)" }} />
    </div>
  );
}

export function Samurai() {
  return (
    <svg width={96} height={150} viewBox="0 0 96 150">
      <defs>
        <radialGradient id="auraB" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.aura} stopOpacity=".4" />
          <stop offset="100%" stopColor={C.aura} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="80" rx="46" ry="64" fill="url(#auraB)" />
      <path d="M40 96 L33 134 L44 134 L48 100 Z" fill="#1c2230" />
      <path d="M52 98 L60 132 L70 132 L60 98 Z" fill="#262d3d" />
      <path d="M36 58 Q34 90 40 100 L62 100 Q66 86 60 58 Z" fill="#2b3346" />
      <path d="M48 60 L48 100" stroke={C.aura} strokeWidth="2" opacity=".7" />
      <rect x="38" y="82" width="26" height="7" fill={C.inkRed} />
      <path d="M58 66 L82 60" stroke="#d9d2c7" strokeWidth="5" strokeLinecap="round" />
      <path d="M80 60 L96 56" stroke="#cfd6e0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="58" cy="66" r="4" fill="#3a4252" />
      <circle cx="50" cy="44" r="13" fill="#e8c9a0" />
      <path d="M62 42 Q66 44 62 47" fill="#e8c9a0" />
      <circle cx="42" cy="32" r="6" fill="#16181f" />
      <path d="M38 38 Q48 28 58 36 L56 44 Q48 36 40 44 Z" fill="#16181f" />
      <circle cx="54" cy="43" r="1.7" fill="#1a1a1a" />
      <path d="M37 40 L63 38" stroke={C.inkRed} strokeWidth="3" />
    </svg>
  );
}

export function FireImp() {
  return (
    <svg width={96} height={150} viewBox="0 0 96 150">
      <defs>
        <radialGradient id="auraR" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.burn} stopOpacity=".45" />
          <stop offset="100%" stopColor={C.burn} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="84" rx="44" ry="60" fill="url(#auraR)" />
      <path d="M42 104 L34 132 L46 132 L50 106 Z" fill="#7a1f2a" />
      <path d="M54 106 L62 132 L72 132 L62 104 Z" fill="#9a2533" />
      <ellipse cx="50" cy="84" rx="22" ry="24" fill={C.inkRed} />
      <ellipse cx="50" cy="84" rx="22" ry="24" fill="none" stroke={C.burn} strokeWidth="1.5" />
      <path d="M42 74 Q50 88 58 74" stroke={C.burn} strokeWidth="1.5" fill="none" opacity=".6" />
      <path d="M40 78 L20 72" stroke={C.inkRed} strokeWidth="6" strokeLinecap="round" />
      <path d="M20 72 l-5 -3 M20 72 l-5 1 M20 72 l-4 4" stroke={C.burn} strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="50" r="15" fill={C.inkRed} />
      <circle cx="50" cy="50" r="15" fill="none" stroke={C.burn} strokeWidth="1.5" />
      <path d="M36 52 Q30 54 36 58 Z" fill={C.inkRed} />
      <path d="M44 38 L40 26 L48 36 Z" fill="#3a0f16" />
      <path d="M56 38 L60 26 L52 36 Z" fill="#3a0f16" />
      <path d="M44 34 Q48 22 52 34 Q56 24 58 36" stroke={C.burn} strokeWidth="2.5" fill="none">
        <animate attributeName="opacity" values="1;.5;1" dur="0.8s" repeatCount="indefinite" />
      </path>
      <circle cx="44" cy="49" r="3.4" fill={C.inkGold} />
      <circle cx="44" cy="49" r="1.3" fill="#000" />
      <path d="M38 44 L48 46" stroke="#3a0f16" strokeWidth="2" />
    </svg>
  );
}

export function PagodaBackdrop() {
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

export function Embers() {
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

export function FlameGlyph() {
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

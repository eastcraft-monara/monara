import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import useGameStore from '@/store/gameStore';
import { C } from "../theme";

export function Bar({ value, max, color, bg = "#000", height = 18, glow, flipDrain }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{
      width: "100%", height, background: "var(--ink-black)",
      border: `2px solid var(--chrome-shadow)`, borderRadius: 2, overflow: "hidden",
      position: "relative", transform: "skewX(-20deg)",
      boxShadow: glow ? `0 0 10px rgba(0,0,0,0.5)` : "none"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        boxShadow: "inset 0 4px 6px rgba(255,255,255,0.15)",
        zIndex: 10
      }} />
      <div style={{
        width: `${pct}%`, height: "100%", 
        background: `var(--signal-red)`, opacity: 0.8,
        transition: "width 1.2s ease-out",
        position: "absolute",
        left: flipDrain ? "auto" : 0,
        right: flipDrain ? 0 : "auto",
        zIndex: 1
      }} />
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

export function TierBadge({ tier }) {
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
      color: t.c, padding: "3px 0",
      borderRadius: 2, display: "inline-flex", gap: 6, alignItems: "center",
    }}>
      {tier} {t.m !== "1x" && <><span style={{ opacity: .6 }}>·</span> {t.m}</>}
    </span>
  );
}

export function Panel({ children, accent }) {
  return (
    <div style={{ background: C.bgPanel, border: `1px solid ${accent ? accent + "55" : "#ffffff12"}`,
      borderRadius: 6, padding: "18px 20px", textAlign: "left" }}>{children}</div>
  );
}

export function Row({ label, value, mono, gold, burn }) {
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

export function Eyebrow({ children, color }) {
  return <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5,
    letterSpacing: 2.5, textTransform: "uppercase", color: color || C.ashDim }}>{children}</div>;
}

export function Tag({ children, c }) {
  return <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
    color: c, border: `1px solid ${c}55`, padding: "5px 10px", borderRadius: 3 }}>{children}</span>;
}

export function GoldBtn({ children, onClick, small }) {
  return <button onClick={onClick} style={{
    fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: .5,
    fontSize: small ? 12.5 : 14, padding: small ? "11px 18px" : "14px 30px",
    background: C.inkGold, color: C.bgDeep, border: "none", borderRadius: 3,
    cursor: "pointer", boxShadow: `0 4px 20px ${C.inkGold}33`,
  }}>{children}</button>;
}

export function RedBtn({ children, onClick, small }) {
  return <button onClick={onClick} style={{
    fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: .5,
    fontSize: small ? 12.5 : 14, padding: small ? "11px 18px" : "14px 30px",
    background: C.inkRed, color: C.ash, border: "none", borderRadius: 3,
    cursor: "pointer", boxShadow: `0 4px 20px ${C.inkRed}44`, width: "100%",
  }}>{children}</button>;
}

export function ResultBtn({ win, onClick }) {
  return <button onClick={onClick} style={{
    width: "100%", fontFamily: "var(--font-saira)", fontWeight: 700, fontSize: 16,
    padding: "14px", borderRadius: 4, cursor: "pointer", border: "none",
    color: win ? C.bgDeep : C.ash, background: win ? C.gestureOk : C.burn,
    letterSpacing: 1, marginTop: 4,
  }}>{win ? "VICTORY — Claim Reward →" : "DEFEAT — See the Ash →"}</button>;
}

export function Stage({ children, battle }) {
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

export function TopBar({ tier, balance, go, TowerGlyph }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      paddingBottom: 16, borderBottom: "1px solid #ffffff12", maxWidth: 900, margin: "0 auto" }}>
      <button onClick={() => go("map")} style={{ background: "none", border: "none",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        {TowerGlyph && <TowerGlyph size={26} />}
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

'use client';

import { useEffect, useRef } from 'react';
import useGameStore from '@/store/gameStore';

export default function GameContainer() {
  const gameRef = useRef(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues with Phaser
    import('phaser').then((Phaser) => {
      import('@/game/config').then(({ config }) => {
        if (!gameRef.current) {
          gameRef.current = new Phaser.Game(config);
        }
      });
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div id="game-container" className="w-full h-full border-4 border-[#1A1520] rounded-xl overflow-hidden shadow-2xl relative">
      {/* Phaser Canvas will be injected here */}
    </div>
  );
}

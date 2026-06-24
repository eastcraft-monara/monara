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
    <div id="game-container" className="w-full h-full relative" style={{ minHeight: 340 }}>
      {/* Phaser Canvas will be injected here */}
    </div>
  );
}

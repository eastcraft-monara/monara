'use client';

import dynamic from 'next/dynamic';
import WebcamPanel from '@/ui/WebcamPanel';
import ChallengeCard from '@/ui/ChallengeCard';
import TokenGate from '@/wallet/TokenGate';

const GameContainer = dynamic(() => import('@/ui/GameContainer'), { ssr: false });

export default function Home() {
  return (
    <TokenGate>
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[var(--bg-deep)]">
        <div className="relative w-full max-w-5xl aspect-video border-2 border-[var(--ink-gold)] rounded shadow-[0_0_50px_rgba(200,51,74,0.3)]">
          <GameContainer />
          <ChallengeCard />
          <WebcamPanel />
        </div>
      </main>
    </TokenGate>
  );
}

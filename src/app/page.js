'use client';

import dynamic from 'next/dynamic';
import WebcamPanel from '@/ui/WebcamPanel';
import ChallengeCard from '@/ui/ChallengeCard';

const GameContainer = dynamic(() => import('@/ui/GameContainer'), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0D0A0E] p-8">
      <div className="relative w-full max-w-5xl aspect-video border-2 border-[#D4A853] rounded shadow-[0_0_50px_rgba(200,51,74,0.3)]">
        <GameContainer />
        <ChallengeCard />
        <WebcamPanel />
      </div>
    </main>
  );
}

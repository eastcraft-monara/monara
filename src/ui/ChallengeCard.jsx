'use client';
import useGameStore from '@/store/gameStore';

export default function ChallengeCard() {
  const targetSign = useGameStore((state) => state.targetSign);
  const currentScene = useGameStore((state) => state.currentScene);
  const latestPrediction = useGameStore((state) => state.latestPrediction);

  if (currentScene !== 'Battle' || !targetSign) return null;

  const isMatched = latestPrediction?.char === targetSign;

  return (
    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-[#1A1520] border-4 border-[#C8334A] px-10 py-6 rounded-md shadow-2xl z-40 transition-all duration-300">
      <div className="flex flex-col items-center">
        <h2 className="text-[#E8E2D9] font-serif text-xl mb-2 tracking-widest">ASL CHALLENGE</h2>
        <div className="text-7xl font-bold text-[#D4A853] font-mono tracking-widest">
          {targetSign}
        </div>
        
        {latestPrediction && (
          <div className="mt-4 text-sm font-mono px-4 py-2 bg-black/60 rounded text-gray-300">
            Detected: <span className={isMatched ? "text-[#4CAF82] font-bold" : "text-[#E05252] font-bold"}>{latestPrediction.char}</span> 
            <span className="text-xs ml-2">({(latestPrediction.confidence * 100).toFixed(0)}%)</span>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import useGameStore from '@/store/gameStore';

export default function WebcamPanel() {
  const videoRef = useRef(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [showGhost, setShowGhost] = useState(false);
  const setGesturePrediction = useGameStore((state) => state.setGesturePrediction);
  const targetSign = useGameStore((state) => state.targetSign);

  useEffect(() => {
    if (targetSign) {
      setShowGhost(true);
      const timer = setTimeout(() => {
        setShowGhost(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [targetSign]);

  useEffect(() => {
    let active = true;
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });
        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCameraAccess(true);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }
    setupCamera();

    // MOCK GESTURE ENGINE: 
    // Since ML is skipped, we simulate gesture predictions using keyboard inputs
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      // If user types A-Z or 0-9, simulate a single letter. If space, simulate the full target word.
      if (/^[A-Z0-9 ]$/.test(key)) {
        let predicted = key;
        if (key === ' ') {
          predicted = useGameStore.getState().targetSign; // Auto-predict current target word
        }
        
        if (predicted) {
          console.log(`[Mock Gesture Engine] Predict: ${predicted} (Confidence: 95%)`);
          setGesturePrediction({ char: predicted, confidence: 0.95, timestamp: Date.now() });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      active = false;
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setGesturePrediction]);

  return (
    <div className="absolute bottom-6 right-6 w-56 h-40 bg-[#1A1520] border-4 border-[#D4A853] rounded-md overflow-hidden shadow-2xl z-50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100" 
      />
      
      {!hasCameraAccess && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-[#E8E2D9] bg-black/80 font-mono text-[10px] text-center leading-tight">
          <span>Camera offline</span>
          <span className="text-[#4CAF82] mt-1 font-bold">Mock Mode:</span>
          <span>Press A-Z/0-9</span>
          <span className="text-[#D4A853]">Press SPACE for words</span>
        </div>
      )}

      {/* Ghost overlay for teaching signs */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 flex items-center justify-center bg-black/40 mix-blend-screen
          ${showGhost ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <span className="text-[120px] font-bold text-[#4CAF82] font-mono opacity-60">
          {targetSign}
        </span>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import useGameStore from '@/store/gameStore';

export default function WebcamPanel() {
  const videoRef = useRef(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const setGesturePrediction = useGameStore((state) => state.setGesturePrediction);

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
      // If user types A-Z or 0-9, simulate a successful gesture detection
      if (/^[A-Z0-9]$/.test(key)) {
        console.log(`[Mock Gesture Engine] Predict: ${key} (Confidence: 95%)`);
        setGesturePrediction({ char: key, confidence: 0.95, timestamp: Date.now() });
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
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-[#E8E2D9] bg-black/80 font-mono text-xs text-center">
          <span>Camera offline</span>
          <span className="text-[#4CAF82] mt-2">Mock Mode:</span>
          <span>Press any key A-Z</span>
        </div>
      )}

      {/* Ghost overlay for teaching signs */}
      <div id="ghost-diagram-container" className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 mix-blend-screen bg-blue-500/20"></div>
    </div>
  );
}

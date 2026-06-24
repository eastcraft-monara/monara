import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import * as fp from 'fingerpose';
import useGameStore from '@/store/gameStore';
import { ALL_GESTURES } from '@/game/systems/ASLGestures';

// Required for Next.js to not throw backend errors
import '@tensorflow/tfjs-backend-webgl';

const C = {
  bgDeep: "#0a0709",
  inkRed: "#d62828",
  inkGold: "#d4a853",
  gestureOk: "#4CAF82",
  gestureBad: "#FF5252",
  ashDim: "#ffffff40",
};

export default function WebcamPanel({ status, targetSign, onModelReady }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [ghostKey, setGhostKey] = useState(0);

  // Restart ghost animation on target change
  useEffect(() => {
    setGhostKey(k => k + 1);
  }, [targetSign]);

  // Load Handpose model
  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready(); // Ensure backend is initialized
        const net = await handpose.load();
        setModel(net);
        if (onModelReady) onModelReady();
        console.log("Handpose model loaded");
      } catch (err) {
        console.error("Failed to load handpose:", err);
      }
    }
    loadModel();
  }, []);

  // Main Detection Loop
  useEffect(() => {
    if (!model) return;
    
    // Create gesture estimator
    const GE = new fp.GestureEstimator(ALL_GESTURES);
    
    let raf;
    const detect = async () => {
      // Check data is available
      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        // Get Video Properties
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video & canvas height and width
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;
        
        if (canvasRef.current) {
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          const ctx = canvasRef.current.getContext("2d");
          
          try {
            // Make predictions
            const hand = await model.estimateHands(video);

            // Clear canvas
            ctx.clearRect(0, 0, videoWidth, videoHeight);

            if (hand.length > 0) {
              // Draw Hand landmarks
              drawHand(hand[0].landmarks, ctx);
              
              // Estimate Gesture with lower threshold to see partials
              const est = GE.estimate(hand[0].landmarks, 4.0); 
              if (est.gestures.length > 0) {
                // Look for target sign specifically
                const targetMatch = est.gestures.find(g => g.name === targetSign);
                
                if (targetMatch) {
                  useGameStore.getState().setGesturePrediction({ 
                    char: targetMatch.name, 
                    confidence: targetMatch.score / 10, // Normalize 0-1
                    timestamp: Date.now() 
                  });
                } else {
                  // Find highest wrong gesture to show they are doing something else
                  const result = est.gestures.reduce((p, c) => (p.score > c.score) ? p : c);
                  useGameStore.getState().setGesturePrediction({ 
                    char: result.name, 
                    confidence: (result.score / 10) * 0.4, // Cap wrong gestures at 40% conf visually
                    timestamp: Date.now() 
                  });
                }
              } else {
                 // No gesture recognized
                 useGameStore.getState().setGesturePrediction({ char: 'none', confidence: 0, timestamp: Date.now() });
              }
            }
          } catch (e) {
            // Ignore estimation errors on fast refresh
          }
        }
      }
      
      // Loop
      raf = requestAnimationFrame(detect);
    };

    detect();
    
    return () => {
      cancelAnimationFrame(raf);
    }
  }, [model, targetSign]);

  const label = status === "ok" ? "SIGN LOCKED" : status === "bad" ? "NO MATCH" : "TRACKING";
  const lc = status === "ok" ? C.gestureOk : status === "bad" ? C.gestureBad : C.inkGold;
  
  return (
    <div style={{ position: "relative", borderRadius: 4, overflow: "hidden",
      border: `1px solid ${lc}66`, boxShadow: `0 0 24px ${lc}22`, background: "#000",
      height: 225 }}>
      
      <Webcam
        ref={webcamRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 9,
          width: 300,
          height: 225,
          objectFit: "cover",
          transform: "scaleX(-1)" // Mirror
        }}
      />
      
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
          width: 300,
          height: 225,
          objectFit: "cover",
          transform: "scaleX(-1)" // Mirror overlay
        }}
      />
      
      {/* Ghost ASL Diagram Overlay */}
      {targetSign && (
        <div key={ghostKey} style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Cinzel', serif", fontSize: 130, fontWeight: 900, color: C.inkGold,
          pointerEvents: "none", animation: "ghostFade 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          textShadow: `0 0 20px ${C.inkGold}, 0 0 40px ${C.inkRed}`,
          mixBlendMode: "screen", opacity: 0, zIndex: 11
        }}>
          {targetSign}
        </div>
      )}

      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 12,
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1.5,
        color: lc, background: "#000a", padding: "2px 7px", borderRadius: 2 }}>
        ● {label}
      </div>
      
      {!model && (
        <div style={{ position: "absolute", inset: 0, zIndex: 13, background: "#000c",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.inkGold }}>
          Loading AI Model...
        </div>
      )}
    </div>
  );
}

// Drawing utility for the hand landmarks
const fingerJoints = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

function drawHand(landmarks, ctx) {
  // Draw points
  for (let i = 0; i < landmarks.length; i++) {
    const x = landmarks[i][0];
    const y = landmarks[i][1];
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 3 * Math.PI);
    ctx.fillStyle = "#d4a853";
    ctx.fill();
  }

  // Draw lines
  for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
    let finger = Object.keys(fingerJoints)[j];
    for (let k = 0; k < fingerJoints[finger].length - 1; k++) {
      const firstJointIndex = fingerJoints[finger][k];
      const secondJointIndex = fingerJoints[finger][k + 1];

      ctx.beginPath();
      ctx.moveTo(
        landmarks[firstJointIndex][0],
        landmarks[firstJointIndex][1]
      );
      ctx.lineTo(
        landmarks[secondJointIndex][0],
        landmarks[secondJointIndex][1]
      );
      ctx.strokeStyle = "#4CAF82";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

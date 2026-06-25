import React, { useRef, useEffect } from 'react';
import useGameStore from '@/store/gameStore';

const C = {
  bgDeep: "#0a0709",
  inkRed: "#d62828",
  inkGold: "#d4a853",
  gestureOk: "#4CAF82",
  gestureBad: "#FF5252",
  ashDim: "#ffffff40",
};

export default function OpponentWebcamPanel() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let raf;
    let currentRenderedLandmarks = null;
    
    // Linear Interpolation for smoothness
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

    const renderLoop = () => {
      const targetLandmarks = useGameStore.getState().opponentLandmarks;
      if (canvasRef.current && targetLandmarks) {
        if (!currentRenderedLandmarks) {
          // Deep copy on first frame
          currentRenderedLandmarks = JSON.parse(JSON.stringify(targetLandmarks));
        } else {
          // Lerp towards target
          for (let i = 0; i < targetLandmarks.length; i++) {
            currentRenderedLandmarks[i][0] = lerp(currentRenderedLandmarks[i][0], targetLandmarks[i][0], 0.3);
            currentRenderedLandmarks[i][1] = lerp(currentRenderedLandmarks[i][1], targetLandmarks[i][1], 0.3);
          }
        }

        const ctx = canvasRef.current.getContext("2d");
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        ctx.clearRect(0, 0, width, height);
        
        // The sender webcam is 640x480, our canvas is 300x225. 
        // We must scale the landmarks so they fit perfectly.
        const scaleX = width / 640;
        const scaleY = height / 480;
        
        drawHand(currentRenderedLandmarks, ctx, scaleX, scaleY);
      }
      raf = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0008" }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={225}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)" // Match the local mirror for consistency
        }}
      />
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

function drawHand(landmarks, ctx, scaleX, scaleY) {
  // Draw points
  for (let i = 0; i < landmarks.length; i++) {
    const x = landmarks[i][0] * scaleX;
    const y = landmarks[i][1] * scaleY;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 3 * Math.PI);
    ctx.fillStyle = "#d62828"; // Red for opponent
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
        landmarks[firstJointIndex][0] * scaleX,
        landmarks[firstJointIndex][1] * scaleY
      );
      ctx.lineTo(
        landmarks[secondJointIndex][0] * scaleX,
        landmarks[secondJointIndex][1] * scaleY
      );
      ctx.strokeStyle = "#d4a853"; // Gold lines
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

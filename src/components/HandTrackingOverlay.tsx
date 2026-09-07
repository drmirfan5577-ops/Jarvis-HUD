import { useEffect, useRef } from 'react';
import type { HandLandmark } from '../types/tracking';

interface HandTrackingOverlayProps {
  handGesture: HandLandmark | null;
  videoElement: HTMLVideoElement | null;
}

// MediaPipe hand connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // Index finger
  [0, 9], [9, 10], [10, 11], [11, 12],      // Middle finger
  [0, 13], [13, 14], [14, 15], [15, 16],    // Ring finger
  [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
  [5, 9], [9, 13], [13, 17]                 // Palm
];

export default function HandTrackingOverlay({ handGesture, videoElement }: HandTrackingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video display size
    const updateCanvasSize = () => {
      canvas.width = videoElement.offsetWidth;
      canvas.height = videoElement.offsetHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Animation loop
    let animationFrameId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (handGesture && handGesture.landmarks.length > 0) {
        const landmarks = handGesture.landmarks;
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;

        // Scale landmarks to canvas size
        const scaleX = canvas.width / videoWidth;
        const scaleY = canvas.height / videoHeight;

        // Draw connections
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';

        HAND_CONNECTIONS.forEach(([start, end]) => {
          const startPoint = landmarks[start];
          const endPoint = landmarks[end];

          ctx.beginPath();
          ctx.moveTo(startPoint.x * videoWidth * scaleX, startPoint.y * videoHeight * scaleY);
          ctx.lineTo(endPoint.x * videoWidth * scaleX, endPoint.y * videoHeight * scaleY);
          ctx.stroke();
        });

        // Draw landmarks
        landmarks.forEach((landmark, index) => {
          const x = landmark.x * videoWidth * scaleX;
          const y = landmark.y * videoHeight * scaleY;

          // Larger dots for key points
          const isKeyPoint = index === 0 || index === 4 || index === 8 || index === 12 || index === 16 || index === 20;
          const radius = isKeyPoint ? 6 : 4;

          // Draw outer glow
          ctx.beginPath();
          ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
          ctx.fill();

          // Draw main dot
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = isKeyPoint ? '#00ffff' : '#00aaff';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00ffff';
          ctx.fill();
        });

        // Draw hand label
        const wrist = landmarks[0];
        const labelX = wrist.x * videoWidth * scaleX;
        const labelY = wrist.y * videoHeight * scaleY - 30;

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.font = 'bold 14px Share Tech Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${handGesture.isLeftHand ? 'LEFT' : 'RIGHT'} HAND`,
          labelX,
          labelY
        );

        // Draw pinch indicator
        ctx.font = '12px Share Tech Mono, monospace';
        ctx.fillText(
          `PINCH: ${(handGesture.pinchDistance * 100).toFixed(1)}%`,
          labelX,
          labelY + 20
        );
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [handGesture, videoElement]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-5"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

import { useEffect, useRef } from 'react';
import type { FaceLandmark } from '../types/tracking';

interface FaceTrackingOverlayProps {
  faceData: FaceLandmark | null;
  videoElement: HTMLVideoElement | null;
}

// Key facial feature indices for visualization
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263];
const LEFT_EYEBROW = [70, 63, 105, 66, 107];
const RIGHT_EYEBROW = [336, 296, 334, 293, 300];
const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
const NOSE = [1, 2, 98, 327];

export default function FaceTrackingOverlay({ faceData, videoElement }: FaceTrackingOverlayProps) {
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

      if (faceData && faceData.landmarks && faceData.landmarks.length === 468) {
        const landmarks = faceData.landmarks;
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        const scaleX = canvas.width / videoWidth;
        const scaleY = canvas.height / videoHeight;

        // Helper function to draw a path
        const drawPath = (indices: number[], color: string, lineWidth: number, closed: boolean = false) => {
          if (indices.length < 2) return;
          
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
          
          ctx.beginPath();
          const start = landmarks[indices[0]];
          ctx.moveTo(start.x * videoWidth * scaleX, start.y * videoHeight * scaleY);
          
          for (let i = 1; i < indices.length; i++) {
            const point = landmarks[indices[i]];
            ctx.lineTo(point.x * videoWidth * scaleX, point.y * videoHeight * scaleY);
          }
          
          if (closed) {
            ctx.closePath();
          }
          
          ctx.stroke();
        };

        // Draw face oval
        drawPath(FACE_OVAL, 'rgba(0, 255, 255, 0.4)', 2, true);

        // Draw eyes
        drawPath(LEFT_EYE, 'rgba(0, 255, 255, 0.8)', 2, true);
        drawPath(RIGHT_EYE, 'rgba(0, 255, 255, 0.8)', 2, true);

        // Draw eyebrows
        drawPath(LEFT_EYEBROW, 'rgba(0, 200, 255, 0.7)', 2.5);
        drawPath(RIGHT_EYEBROW, 'rgba(0, 200, 255, 0.7)', 2.5);

        // Draw lips
        drawPath(LIPS, 'rgba(255, 0, 200, 0.6)', 2, true);

        // Draw nose
        drawPath(NOSE, 'rgba(0, 255, 150, 0.5)', 2);

        // Draw key points
        ctx.shadowBlur = 0;
        [
          ...LEFT_EYE, ...RIGHT_EYE,
          ...LEFT_EYEBROW, ...RIGHT_EYEBROW,
          ...LIPS, ...NOSE
        ].forEach(index => {
          const point = landmarks[index];
          const x = point.x * videoWidth * scaleX;
          const y = point.y * videoHeight * scaleY;

          // Outer glow
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
          ctx.fill();

          // Main dot
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#00ffff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ffff';
          ctx.fill();
        });

        // Draw tracking confidence
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.font = 'bold 12px Share Tech Mono, monospace';
        ctx.textAlign = 'center';
        
        const noseTip = landmarks[1];
        const labelX = noseTip.x * videoWidth * scaleX;
        const labelY = (noseTip.y * videoHeight * scaleY) + 40;
        
        ctx.fillText(
          `TRACKING: ${(faceData.confidence * 100).toFixed(0)}%`,
          labelX,
          labelY
        );
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [faceData, videoElement]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-5"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

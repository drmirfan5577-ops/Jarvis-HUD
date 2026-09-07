import { useEffect, useRef, useState } from 'react';
import WebcamFeed from './WebcamFeed';
import HeadsUpDisplay from './HeadsUpDisplay';
import Globe from './Globe';
import HandTrackingOverlay from './HandTrackingOverlay';
import FaceTrackingOverlay from './FaceTrackingOverlay';
import { initializeMediaPipe } from '../lib/mediapipe';
import { analyzeFacialEmotion } from '../lib/emotionAnalyzer';
import type { FaceLandmark, HandLandmark, MoodState } from '../types/tracking';

export default function JarvisHUD() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [facePosition, setFacePosition] = useState<FaceLandmark | null>(null);
  const [handGesture, setHandGesture] = useState<HandLandmark | null>(null);
  const [moodState, setMoodState] = useState<MoodState>({ mood: 'neutral', confidence: 0, description: 'Analyzing...' });
  const [fps, setFps] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'initializing' | 'active' | 'error'>('initializing');

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const initialize = async () => {
      try {
        if (!videoRef.current) return;

        console.log('🚀 Initializing JARVIS systems...');
        
        // Initialize MediaPipe tracking
        const { faceDetector, faceLandmarker, handDetector, startTracking } = await initializeMediaPipe();
        
        console.log('✅ MediaPipe initialized');
        setIsInitialized(true);
        setSystemStatus('active');

        // Start tracking loop
        const trackingLoop = async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) {
            animationFrameId = requestAnimationFrame(trackingLoop);
            return;
          }

          try {
            const timestamp = performance.now();

            // Face detection (VIDEO mode requires detectForVideo with timestamp)
            const faces = await faceDetector.detectForVideo(videoRef.current, timestamp);
            const faceLandmarks = await faceLandmarker.detectForVideo(videoRef.current, timestamp);
            
            if (faces.detections.length > 0) {
              const face = faces.detections[0];
              const box = face.boundingBox;
              
              // Get detailed landmarks if available
              const landmarks = faceLandmarks.faceLandmarks[0] || undefined;
              const blendshapes = faceLandmarks.faceBlendshapes?.[0] || undefined;
              
              // Analyze emotion from landmarks
              if (landmarks) {
                const emotion = analyzeFacialEmotion(landmarks);
                setMoodState(emotion);
              }
              
              setFacePosition({
                x: box.originX + box.width / 2,
                y: box.originY + box.height / 2,
                width: box.width,
                height: box.height,
                confidence: face.categories[0]?.score || 0,
                landmarks,
                blendshapes
              });
            } else {
              setFacePosition(null);
            }

            // Hand detection (VIDEO mode requires detectForVideo with timestamp)
            const hands = await handDetector.detectForVideo(videoRef.current, timestamp);
            if (hands.landmarks.length > 0) {
              const hand = hands.landmarks[0];
              const handedness = hands.handednesses[0]?.[0];
              
              // Calculate center of hand
              const centerX = hand.reduce((sum, point) => sum + point.x, 0) / hand.length;
              const centerY = hand.reduce((sum, point) => sum + point.y, 0) / hand.length;
              
              // Calculate pinch distance (thumb tip to index finger tip)
              const thumbTip = hand[4];
              const indexTip = hand[8];
              const pinchDistance = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) + 
                Math.pow(thumbTip.y - indexTip.y, 2)
              );

              setHandGesture({
                x: centerX,
                y: centerY,
                landmarks: hand,
                pinchDistance,
                isLeftHand: handedness?.categoryName === 'Left',
                confidence: handedness?.score || 0,
              });
            } else {
              setHandGesture(null);
            }

            // Calculate FPS
            frameCount++;
            const currentTime = performance.now();
            if (currentTime >= lastTime + 1000) {
              setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
              frameCount = 0;
              lastTime = currentTime;
            }

          } catch (error) {
            console.error('Tracking error:', error);
          }

          animationFrameId = requestAnimationFrame(trackingLoop);
        };

        startTracking();
        trackingLoop();

      } catch (error) {
        console.error('❌ Initialization failed:', error);
        setSystemStatus('error');
      }
    };

    initialize();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-jarvis-dark">
      {/* Webcam Feed */}
      <WebcamFeed ref={videoRef} />

      {/* Hand Tracking Overlay */}
      <HandTrackingOverlay handGesture={handGesture} videoElement={videoRef.current} />

      {/* Face Tracking Overlay */}
      <FaceTrackingOverlay faceData={facePosition} videoElement={videoRef.current} />

      {/* Grid Overlay */}
      <div className="grid-overlay" />

      {/* Scan Line Effect */}
      <div className="scan-line" />

      {/* Heads Up Display */}
      <HeadsUpDisplay 
        facePosition={facePosition}
        moodState={moodState}
        fps={fps}
        systemStatus={systemStatus}
        handDetected={handGesture !== null}
      />

      {/* 3D Globe */}
      <Globe handGesture={handGesture} />

      {/* System Boot Message */}
      {!isInitialized && systemStatus === 'initializing' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-jarvis-dark/95">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-glow-strong">
              J.A.R.V.I.S.
            </div>
            <div className="text-glow text-sm">
              Just A Rather Very Intelligent System
            </div>
            <div className="flex items-center justify-center gap-2 mt-8">
              <div className="status-indicator" />
              <span className="text-glow text-xs">Initializing systems...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {systemStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-jarvis-dark/95">
          <div className="text-center space-y-4 max-w-md px-8">
            <div className="text-2xl font-bold text-red-500">
              System Error
            </div>
            <div className="text-sm text-red-400">
              Failed to initialize tracking systems. Please ensure camera permissions are granted and try refreshing the page.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

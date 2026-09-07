import { useEffect, useState } from 'react';
import type { FaceLandmark, MoodState } from '../types/tracking';

interface HeadsUpDisplayProps {
  facePosition: FaceLandmark | null;
  moodState: MoodState;
  fps: number;
  systemStatus: 'initializing' | 'active' | 'error';
  handDetected: boolean;
}

export default function HeadsUpDisplay({ 
  facePosition, 
  moodState,
  fps, 
  systemStatus,
  handDetected 
}: HeadsUpDisplayProps) {
  const [time, setTime] = useState(new Date());
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (facePosition) {
      // Offset HUD to the right of the face
      const offsetX = 150;
      const offsetY = -50;
      setTargetPosition({
        x: facePosition.x + offsetX,
        y: facePosition.y + offsetY
      });
    }
  }, [facePosition]);

  const hudStyle = facePosition ? {
    transform: `translate(${targetPosition.x}px, ${targetPosition.y}px)`,
    transition: 'transform 0.2s ease-out',
  } : {};

  return (
    <div className="hud-container absolute inset-0 z-10">
      {/* Corner Brackets */}
      <div className="absolute top-8 left-8 w-32 h-32 pointer-events-none">
        <div className="hud-corner top-left" />
      </div>
      <div className="absolute top-8 right-8 w-32 h-32 pointer-events-none">
        <div className="hud-corner top-right" />
      </div>
      <div className="absolute bottom-8 left-8 w-32 h-32 pointer-events-none">
        <div className="hud-corner bottom-left" />
      </div>
      <div className="absolute bottom-8 right-8 w-32 h-32 pointer-events-none">
        <div className="hud-corner bottom-right" />
      </div>

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <div className="hud-panel px-6 py-3 rounded-lg max-w-fit mx-auto">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className={`status-indicator ${systemStatus === 'active' ? 'active' : systemStatus === 'error' ? 'inactive' : ''}`} />
              <span className="text-glow">SYSTEM {systemStatus.toUpperCase()}</span>
            </div>
            <div className="text-glow">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-glow">
              FPS: {fps}
            </div>
          </div>
        </div>
      </div>

      {/* Face-Tracking HUD Panel */}
      {facePosition && (
        <div 
          className="absolute top-0 left-0 w-72"
          style={hudStyle}
        >
          <div className="hud-panel p-4 rounded-lg space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-jarvis-cyan/30 pb-2">
              <span className="text-glow-strong text-sm font-bold">BIOMETRIC SCAN</span>
              <div className="status-indicator active" />
            </div>

            {/* Metrics */}
            <div className="space-y-2 text-xs">
              <MetricRow 
                label="TRACKING" 
                value={`${Math.round(facePosition.confidence * 100)}%`}
                percentage={facePosition.confidence * 100}
              />
              <MetricRow 
                label="POSITION X" 
                value={`${Math.round(facePosition.x)}px`}
                percentage={(facePosition.x / window.innerWidth) * 100}
              />
              <MetricRow 
                label="POSITION Y" 
                value={`${Math.round(facePosition.y)}px`}
                percentage={(facePosition.y / window.innerHeight) * 100}
              />
              <MetricRow 
                label="FACE WIDTH" 
                value={`${Math.round(facePosition.width)}px`}
                percentage={Math.min((facePosition.width / 300) * 100, 100)}
              />
            </div>

            {/* Mood Analysis */}
            <div className="pt-2 border-t border-jarvis-cyan/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-glow text-xs">EMOTIONAL STATE</span>
                <div className="status-indicator active" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-glow-strong text-sm uppercase">{moodState.mood}</span>
                  <span className="text-glow text-xs">{(moodState.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="text-glow text-xs opacity-80">{moodState.description}</div>
                <div className="h-1 bg-jarvis-dark/50 rounded-full overflow-hidden">
                  <div 
                    className="metric-bar h-full rounded-full"
                    style={{ width: `${moodState.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hand Detection Status */}
            <div className="pt-2 border-t border-jarvis-cyan/30">
              <div className="flex items-center justify-between">
                <span className="text-glow text-xs">GESTURE CONTROL</span>
                <div className={`status-indicator ${handDetected ? 'active' : 'inactive'}`} />
              </div>
            </div>

            {/* Live Data Feed */}
            <div className="pt-2 border-t border-jarvis-cyan/30">
              <div className="text-glow text-[10px] opacity-70 space-y-1">
                <div>&gt; Facial recognition: ACTIVE</div>
                <div>&gt; Neural interface: ONLINE</div>
                <div>&gt; AR systems: NOMINAL</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="hud-panel px-6 py-3 rounded-lg max-w-fit mx-auto">
          <div className="flex items-center gap-6 text-[10px] text-glow">
            <span>JARVIS v3.0</span>
            <span>|</span>
            <span>Use hand gestures to control the globe</span>
            <span>|</span>
            <span>Pinch to scale • Open palm to rotate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  percentage: number;
}

function MetricRow({ label, value, percentage }: MetricRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-glow">
        <span>{label}</span>
        <span className="text-glow-strong">{value}</span>
      </div>
      <div className="h-1 bg-jarvis-dark/50 rounded-full overflow-hidden">
        <div 
          className="metric-bar h-full rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

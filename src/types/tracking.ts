export interface FaceLandmark {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  landmarks?: Array<{ x: number; y: number; z: number }>;
  blendshapes?: any;
}

export type MoodType = 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry' | 'focused';

export interface MoodState {
  mood: MoodType;
  confidence: number;
  description: string;
}

export interface HandLandmark {
  x: number;
  y: number;
  landmarks: Array<{ x: number; y: number; z: number }>;
  pinchDistance: number;
  isLeftHand: boolean;
  confidence: number;
}

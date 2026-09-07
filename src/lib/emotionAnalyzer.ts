import type { MoodState, MoodType } from '../types/tracking';

/**
 * Analyzes facial landmarks to determine emotional state
 * Based on key facial feature positions and distances
 */
export function analyzeFacialEmotion(landmarks: Array<{ x: number; y: number; z: number }>): MoodState {
  if (!landmarks || landmarks.length < 468) {
    return {
      mood: 'neutral',
      confidence: 0,
      description: 'Analyzing...'
    };
  }

  // Key landmark indices (MediaPipe Face Mesh)
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const rightEyeTop = landmarks[386];
  const rightEyeBottom = landmarks[374];
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const mouthTop = landmarks[13];
  const mouthBottom = landmarks[14];
  const leftEyebrowInner = landmarks[70];
  const leftEyebrowOuter = landmarks[63];
  const rightEyebrowInner = landmarks[300];
  const rightEyebrowOuter = landmarks[293];

  // Calculate eye openness (0 = closed, 1 = wide open)
  const leftEyeOpen = Math.abs(leftEyeTop.y - leftEyeBottom.y);
  const rightEyeOpen = Math.abs(rightEyeTop.y - rightEyeBottom.y);
  const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;

  // Calculate mouth openness
  const mouthOpen = Math.abs(mouthTop.y - mouthBottom.y);
  const mouthWidth = Math.abs(mouthLeft.x - mouthRight.x);
  const mouthAspectRatio = mouthOpen / mouthWidth;

  // Calculate smile (mouth corners position relative to center)
  const mouthCenterY = (mouthTop.y + mouthBottom.y) / 2;
  const leftCornerLift = mouthCenterY - mouthLeft.y;
  const rightCornerLift = mouthCenterY - mouthRight.y;
  const smileIntensity = (leftCornerLift + rightCornerLift) / 2;

  // Calculate eyebrow position (higher = more surprised/alert)
  const leftBrowHeight = leftEyebrowInner.y - leftEyeTop.y;
  const rightBrowHeight = rightEyebrowInner.y - rightEyeTop.y;
  const browHeight = (leftBrowHeight + rightBrowHeight) / 2;

  // Emotion detection logic
  let mood: MoodType = 'neutral';
  let confidence = 0;
  let description = '';

  // Happy: smile + normal eyes
  if (smileIntensity > 0.01 && mouthAspectRatio < 0.6) {
    mood = 'happy';
    confidence = Math.min(smileIntensity * 100, 1);
    description = confidence > 0.7 ? 'Very Happy! 😊' : 'Smiling 🙂';
  }
  // Surprised: wide eyes + open mouth + raised eyebrows
  else if (avgEyeOpen > 0.03 && mouthAspectRatio > 0.8 && browHeight < -0.02) {
    mood = 'surprised';
    confidence = Math.min((avgEyeOpen + mouthAspectRatio - Math.abs(browHeight)) * 0.5, 1);
    description = 'Surprised! 😲';
  }
  // Sad: mouth corners down + slightly closed eyes
  else if (smileIntensity < -0.005 && avgEyeOpen < 0.025) {
    mood = 'sad';
    confidence = Math.min(Math.abs(smileIntensity) * 80, 1);
    description = 'Feeling down 😔';
  }
  // Angry: furrowed brows + tense mouth
  else if (browHeight > 0.005 && mouthAspectRatio < 0.4) {
    mood = 'angry';
    confidence = Math.min(browHeight * 100, 1);
    description = 'Angry 😠';
  }
  // Focused: slightly narrowed eyes + neutral mouth
  else if (avgEyeOpen < 0.022 && Math.abs(smileIntensity) < 0.005 && mouthAspectRatio < 0.5) {
    mood = 'focused';
    confidence = 0.8;
    description = 'Concentrated 🎯';
  }
  // Neutral
  else {
    mood = 'neutral';
    confidence = 0.7;
    description = 'Neutral 😐';
  }

  return {
    mood,
    confidence: Math.max(0.3, confidence),
    description
  };
}

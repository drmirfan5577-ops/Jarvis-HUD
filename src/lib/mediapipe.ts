import { 
  FaceDetector, 
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker
} from '@mediapipe/tasks-vision';

export async function initializeMediaPipe() {
  console.log('⚙️ Loading MediaPipe models...');

  // Load MediaPipe vision tasks
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  // Initialize Face Detector (for bounding box)
  const faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO'
  });

  // Initialize Face Landmarker (for detailed facial features and expressions)
  const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false
  });

  // Initialize Hand Detector
  const handDetector = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 1
  });

  console.log('✅ MediaPipe models loaded successfully');

  return {
    faceDetector,
    faceLandmarker,
    handDetector,
    startTracking: () => {
      console.log('🎯 Tracking systems online');
    }
  };
}

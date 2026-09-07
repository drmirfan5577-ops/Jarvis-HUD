import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const WebcamFeed = forwardRef<HTMLVideoElement>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => videoRef.current!);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('📹 Webcam initialized');
        }
      } catch (error) {
        console.error('Failed to access webcam:', error);
      }
    };

    startWebcam();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="webcam-feed absolute inset-0 w-full h-full object-cover"
    />
  );
});

WebcamFeed.displayName = 'WebcamFeed';

export default WebcamFeed;

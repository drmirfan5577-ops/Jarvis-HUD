import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { HandLandmark } from '../types/tracking';

interface GlobeProps {
  handGesture: HandLandmark | null;
}

export default function Globe({ handGesture }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const [lastGesture, setLastGesture] = useState<HandLandmark | null>(null);
  const rotationSpeedRef = useRef({ x: 0.001, y: 0.003 });
  const scaleRef = useRef(1);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      (containerRef.current.clientWidth) / (containerRef.current.clientHeight),
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create Earth-like globe
    const geometry = new THREE.SphereGeometry(1.5, 64, 64);
    
    // Create custom material with grid lines
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    const globe = new THREE.Mesh(geometry, material);
    globeRef.current = globe;
    scene.add(globe);

    // Add inner glow
    const glowGeometry = new THREE.SphereGeometry(1.4, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    globe.add(glow);

    // Add particles around globe
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.7 + Math.random() * 0.3;

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }

    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (globeRef.current) {
        // Auto-rotation
        globeRef.current.rotation.y += rotationSpeedRef.current.y;
        globeRef.current.rotation.x += rotationSpeedRef.current.x;

        // Apply scale
        globeRef.current.scale.set(scaleRef.current, scaleRef.current, scaleRef.current);
      }

      // Rotate particles slowly
      particles.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Handle hand gestures
  useEffect(() => {
    if (!handGesture) {
      setLastGesture(null);
      return;
    }

    // Pinch gesture for scaling
    if (handGesture.pinchDistance < 0.05) {
      // Pinched (closed hand) - decrease size
      scaleRef.current = Math.max(scaleRef.current - 0.02, 0.5);
    } else if (handGesture.pinchDistance > 0.15) {
      // Open hand - increase size
      scaleRef.current = Math.min(scaleRef.current + 0.02, 2.5);
    }

    // Hand position for rotation control
    if (lastGesture) {
      const deltaX = handGesture.x - lastGesture.x;
      const deltaY = handGesture.y - lastGesture.y;

      // Update rotation speed based on hand movement
      rotationSpeedRef.current = {
        x: deltaY * 0.1,
        y: deltaX * 0.1
      };
    }

    setLastGesture(handGesture);
  }, [handGesture, lastGesture]);

  return (
    <div className="globe-container absolute left-8 top-1/2 -translate-y-1/2 w-96 h-96 z-5">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Globe Info Panel */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="hud-panel px-4 py-2 rounded-lg mx-auto max-w-fit">
          <div className="text-center space-y-1">
            <div className="text-glow-strong text-xs font-bold">GLOBAL POSITIONING</div>
            <div className="text-glow text-[10px]">
              SCALE: {scaleRef.current.toFixed(2)}x
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

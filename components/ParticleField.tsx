"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export default function ParticleField({ state }: { state: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const particlesRef = useRef<THREE.InstancedMesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Geometry + Material (Warm Amber)
    const geometry = new THREE.IcosahedronGeometry(0.04, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0xc8923a,
      emissive: 0x3a2a10,
      roughness: 0.4,
      metalness: 0.6,
    });

    const count = 200;
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    
    // Position particles randomly
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10
      );
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(mesh);
    particlesRef.current = mesh;

    // Lights
    const spotlight = new THREE.PointLight(0xffcc77, 2.0, 20);
    spotlight.position.set(0, 5, 2);
    scene.add(spotlight);
    
    const ambient = new THREE.AmbientLight(0x221a10, 0.4);
    scene.add(ambient);
    
    const rimLight = new THREE.DirectionalLight(0x4488cc, 0.3);
    rimLight.position.set(-3, 0, -5);
    scene.add(rimLight);

    // Mouse Parallax
    const camX = gsap.quickTo(camera.position, 'x', { duration: 1.2, ease: 'power2.out' });
    const camY = gsap.quickTo(camera.position, 'y', { duration: 1.2, ease: 'power2.out' });
    
    const onMouseMove = (e: MouseEvent) => {
      camX((e.clientX / window.innerWidth - 0.5) * 1.5);
      camY(-(e.clientY / window.innerHeight - 0.5) * 0.8);
    };
    window.addEventListener('mousemove', onMouseMove);

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let driftSpeed = 0.001;
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (particlesRef.current) {
        // Slow upward drift
        particlesRef.current.position.y += driftSpeed;
        if (particlesRef.current.position.y > 10) {
          particlesRef.current.position.y = -10;
        }
        particlesRef.current.rotation.y += driftSpeed * 0.5;
        particlesRef.current.rotation.x += driftSpeed * 0.2;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // React to game state changes
  useEffect(() => {
    if (state === 'listen') {
      // Accelerate particles when listening
      gsap.to(particlesRef.current!.rotation, {
        y: "+=2",
        duration: 4,
        ease: "power2.inOut"
      });
    }
  }, [state]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen" 
    />
  );
}

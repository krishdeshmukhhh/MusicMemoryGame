"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

// Loaded via next/dynamic (ssr: false) so three.js is split out of the main bundle.
export default function ParticleField({ state }: { state: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<THREE.InstancedMesh | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return; // WebGL unavailable — the background is purely decorative
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

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
    const driftSpeed = 0.001;
    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);

      // Slow upward drift
      mesh.position.y += driftSpeed;
      if (mesh.position.y > 10) mesh.position.y = -10;
      mesh.rotation.y += driftSpeed * 0.5;
      mesh.rotation.x += driftSpeed * 0.2;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(mesh.rotation);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      particlesRef.current = null;
    };
  }, []);

  // React to game state changes
  useEffect(() => {
    if (state === 'listen' && particlesRef.current) {
      // Accelerate particles when listening
      gsap.to(particlesRef.current.rotation, {
        y: "+=2",
        duration: 4,
        ease: "power2.inOut"
      });
    }
  }, [state]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen"
    />
  );
}

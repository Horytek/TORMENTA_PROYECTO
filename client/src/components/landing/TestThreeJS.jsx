import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const TestThreeJS = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('THREE.js version:', THREE.REVISION);

    // Test básico de Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: false 
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x4a90e2, 1); // Azul visible para test
      
      containerRef.current.appendChild(renderer.domElement);
      console.log('WebGL renderer created successfully');
    } catch (error) {
      console.error('WebGL not supported:', error);
      // Fallback: mostrar un div coloreado
      const fallback = document.createElement('div');
      fallback.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #4a90e2, #7b68ee);
        z-index: -1;
      `;
      containerRef.current.appendChild(fallback);
      return;
    }

    // Crear un cubo simple que rote
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    // Animar
    const animate = () => {
      requestAnimationFrame(animate);
      
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Cleanup
    return () => {
      if (renderer && containerRef.current) {
        try {
          containerRef.current.removeChild(renderer.domElement);
          renderer.dispose();
        } catch (error) {
          console.warn('Error cleaning up:', error);
        }
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        background: '#ff0000' // Rojo como fallback para ver si el div se renderiza
      }}
    />
  );
};
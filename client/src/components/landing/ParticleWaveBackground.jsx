import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ParticleWaveBackground = () => {
  const containerRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let scene, camera, renderer, points;
    
    // Configuración
    const SEPARATION = 100, AMOUNTX = 50, AMOUNTY = 50;
    let count = 0;

    const init = () => {
      const container = containerRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;

      scene = new THREE.Scene();
      // Fondo oscuro profundo
      scene.background = new THREE.Color(0x000000); 
      // Añadir niebla para profundidad
      scene.fog = new THREE.FogExp2(0x000000, 0.0007);

      camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
      camera.position.z = 1000;
      camera.position.y = 300;
      camera.rotation.x = -0.2;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // Partículas
      const numParticles = AMOUNTX * AMOUNTY;
      const positions = new Float32Array(numParticles * 3);
      const scales = new Float32Array(numParticles);

      let i = 0, j = 0;

      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2); // x
          positions[i + 1] = 0; // y
          positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2); // z
          scales[j] = 1;
          i += 3;
          j++;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

      // Material de las partículas (Cyan/Azul brillante)
      const material = new THREE.PointsMaterial({
        color: 0x00ffff, // Cyan brillante
        size: 8, // Tamaño base un poco más grande
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      window.addEventListener('resize', onWindowResize);
    };

    const onWindowResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      render();
    };

    const render = () => {
      if (!points || !renderer || !scene || !camera) return;

      const positions = points.geometry.attributes.position.array;
      const scales = points.geometry.attributes.scale.array;

      let i = 0, j = 0;

      // Animación de onda
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          // Onda sinusoidal compleja
          positions[i + 1] = (Math.sin((ix + count) * 0.3) * 50) +
                             (Math.sin((iy + count) * 0.5) * 50);
          
          // Escala basada en la altura para efecto de brillo
          scales[j] = (Math.sin((ix + count) * 0.3) + 1) * 2 +
                      (Math.sin((iy + count) * 0.5) + 1) * 2;
          
          i += 3;
          j++;
        }
      }

      points.geometry.attributes.position.needsUpdate = true;
      points.geometry.attributes.scale.needsUpdate = true;

      // Rotación lenta de la cámara o escena para dinamismo
      // scene.rotation.y += 0.001;

      count += 0.1;
      renderer.render(scene, camera);
    };

    init();
    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', onWindowResize);
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        renderer.dispose();
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
        background: 'black'
      }}
    />
  );
};

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const MetaballsBackgroundSimple = () => {
  const containerRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let scene, camera, renderer, material, mesh;
    let clock = new THREE.Clock();
    let mouseX = 0, mouseY = 0;

    // Detección de dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Vertex shader simple
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader con efecto de metaballs
    const fragmentShader = `
      uniform float time;
      uniform vec2 mouse;
      uniform vec2 resolution;
      varying vec2 vUv;
      
      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5, 0.5);
        
        // Crear múltiples orbes que se mueven
        float field = 0.0;
        
        // Orbe 1 - más visible
        vec2 pos1 = center + vec2(sin(time * 0.5) * 0.3, cos(time * 0.3) * 0.2);
        field += 0.05 / distance(uv, pos1);
        
        // Orbe 2
        vec2 pos2 = center + vec2(cos(time * 0.4) * 0.25, sin(time * 0.6) * 0.3);
        field += 0.04 / distance(uv, pos2);
        
        // Orbe 3
        vec2 pos3 = center + vec2(sin(time * 0.3) * 0.4, cos(time * 0.8) * 0.15);
        field += 0.03 / distance(uv, pos3);
        
        // Influencia del mouse - más visible
        vec2 mousePos = mouse * 0.5 + 0.5;
        field += 0.02 / distance(uv, mousePos);
        
        // Suavizar y crear colores
        field = smoothstep(0.0, 1.0, field);
        
        // Colores más visibles para debug
        vec3 baseColor = vec3(0.02, 0.02, 0.05); // Negro azulado base
        vec3 glowColor1 = vec3(0.1, 0.05, 0.15); // Púrpura
        vec3 glowColor2 = vec3(0.05, 0.1, 0.2);  // Azul
        
        vec3 finalColor = mix(baseColor, glowColor1, field);
        finalColor = mix(finalColor, glowColor2, field * field);
        
        // Agregar un poco de brillo base para verificar que funciona
        finalColor += vec3(0.01, 0.01, 0.02);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const init = () => {
      const container = containerRef.current;
      if (!container) {
        console.error('Container not found');
        return;
      }

      console.log('Initializing MetaballsBackground...');

      // Escena
      scene = new THREE.Scene();

      // Cámara
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // Renderer
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isMobile,
          alpha: true, // Permitir transparencia
          premultipliedAlpha: false
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
        renderer.setClearColor(0x020203, 1); // Fondo negro muy oscuro
        
        container.appendChild(renderer.domElement);
        console.log('Renderer created and added to DOM');
      } catch (error) {
        console.error('Error creating WebGL renderer:', error);
        return;
      }

      // Material y geometría
      try {
        material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            mouse: { value: new THREE.Vector2(0, 0) },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
          },
          vertexShader,
          fragmentShader
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        console.log('Shaders compiled successfully');
      } catch (error) {
        console.error('Error creating shaders:', error);
        return;
      }

      console.log('MetaballsBackground initialized successfully');
    };

    // Manejo del mouse
    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Resize
    const handleResize = () => {
      if (!renderer || !material) return;
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    };

    // Animación
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (!material || !renderer || !scene || !camera) return;

      const elapsed = clock.getElapsedTime();
      
      // Actualizar uniforms
      material.uniforms.time.value = elapsed;
      material.uniforms.mouse.value.set(mouseX, mouseY);

      renderer.render(scene, camera);
    };

    // Inicializar
    try {
      init();
      animate();
    } catch (error) {
      console.error('Error initializing MetaballsBackground:', error);
    }

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (renderer && containerRef.current) {
        try {
          containerRef.current.removeChild(renderer.domElement);
          renderer.dispose();
        } catch (error) {
          console.warn('Error disposing renderer:', error);
        }
      }
      
      if (scene) {
        scene.clear();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full"
      style={{ 
        zIndex: -1,
        pointerEvents: 'none',
        background: '#020203', // Fallback color
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh'
      }}
    />
  );
};
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const MetaballsBackground = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Variables de configuración
    let scene, camera, renderer, material;
    let clock = new THREE.Clock();
    let mouse = { x: 0, y: 0 };
    let cursorSphere3D = new THREE.Vector3(0, 0, 0);
    let targetMousePosition = new THREE.Vector2(0.5, 0.5);
    let mousePosition = new THREE.Vector2(0.5, 0.5);

    // Detección de dispositivo
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const isLowPowerDevice = isMobile || navigator.hardwareConcurrency <= 4;
    const devicePixelRatio = Math.min(
      window.devicePixelRatio || 1,
      isMobile ? 1.5 : 2
    );

    // Configuración de preset - usando el preset "moody" optimizado
    const config = {
      sphereCount: isMobile ? 2 : 4, // Reducido para mejor rendimiento
      ambientIntensity: 0.02,
      diffuseIntensity: 0.6,
      specularIntensity: 1.8,
      specularPower: 8,
      fresnelPower: 1.2,
      backgroundColor: new THREE.Color(0x050505),
      sphereColor: new THREE.Color(0x000000),
      lightColor: new THREE.Color(0xffffff),
      lightPosition: new THREE.Vector3(1, 1, 1),
      smoothness: 0.3,
      contrast: 2.0,
      fogDensity: 0.12,
      cursorGlowIntensity: isMobile ? 0.2 : 0.4, // Reducido en móviles
      cursorGlowRadius: 1.2,
      cursorGlowColor: new THREE.Color(0xffffff)
    };

    // Shader de metaballs
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 mouse;
      uniform vec3 spherePositions[10];
      uniform int sphereCount;
      uniform float ambientIntensity;
      uniform float diffuseIntensity;
      uniform float specularIntensity;
      uniform float specularPower;
      uniform float fresnelPower;
      uniform vec3 backgroundColor;
      uniform vec3 sphereColor;
      uniform vec3 lightColor;
      uniform vec3 lightPosition;
      uniform float smoothness;
      uniform float contrast;
      uniform float fogDensity;
      uniform float cursorGlowIntensity;
      uniform float cursorGlowRadius;
      uniform vec3 cursorGlowColor;
      uniform vec3 cursorSphere3D;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      float metaball(vec3 pos, vec3 center, float radius) {
        return radius / length(pos - center);
      }
      
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
      
      void main() {
        vec2 uv = (vUv - 0.5) * 2.0;
        vec3 rayOrigin = vec3(0.0, 0.0, 5.0);
        vec3 rayDirection = normalize(vec3(uv, -1.0));
        
        float totalField = 0.0;
        vec3 worldPos = rayOrigin + rayDirection * 2.0;
        
        // Calcular campo de metaballs
        for(int i = 0; i < 10; i++) {
          if(i >= sphereCount) break;
          
          vec3 spherePos = vec3(
            spherePositions[i * 3],
            spherePositions[i * 3 + 1], 
            spherePositions[i * 3 + 2]
          );
          
          float dist = distance(worldPos, spherePos);
          totalField += 1.0 / (dist * dist + 0.1);
        }
        
        // Agregar influencia del cursor
        float cursorDist = distance(worldPos, cursorSphere3D);
        totalField += cursorGlowIntensity / (cursorDist * cursorDist + 0.1);
        
        // Suavizado y contraste
        totalField = smoothstep(0.0, smoothness, totalField);
        totalField = pow(totalField, contrast);
        
        // Efecto de ondas basado en tiempo
        float wave = sin(time * 2.0 + length(uv) * 10.0) * 0.1;
        totalField += wave;
        
        // Color base con gradiente
        vec3 color1 = vec3(0.05, 0.05, 0.1); // Azul muy oscuro
        vec3 color2 = vec3(0.1, 0.05, 0.15); // Púrpura oscuro
        vec3 color3 = vec3(0.0, 0.0, 0.05); // Negro azulado
        
        vec3 finalColor = mix(color3, color1, totalField);
        finalColor = mix(finalColor, color2, totalField * 0.5);
        
        // Agregar brillo en las áreas de alta intensidad
        if (totalField > 0.5) {
          vec3 glowColor = vec3(0.2, 0.1, 0.3);
          finalColor = mix(finalColor, glowColor, (totalField - 0.5) * 2.0);
        }
        
        // Efecto de niebla radial desde el centro
        float radialFog = length(uv) * 0.3;
        finalColor = mix(finalColor, backgroundColor, radialFog);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Inicialización
    const init = () => {
      const container = containerRef.current;
      if (!container) return;

      // Escena
      scene = new THREE.Scene();
      scene.background = config.backgroundColor;

      // Cámara
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 5;

      // Renderer
      renderer = new THREE.WebGLRenderer({ 
        antialias: !isLowPowerDevice,
        alpha: false,
        powerPreference: isLowPowerDevice ? 'low-power' : 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(devicePixelRatio);
      container.appendChild(renderer.domElement);

      // Material con shaders
      const spherePositions = [];
      for (let i = 0; i < config.sphereCount; i++) {
        spherePositions.push(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 2
        );
      }
      // Rellenar el resto del array con ceros
      while (spherePositions.length < 30) { // 10 esferas * 3 componentes
        spherePositions.push(0);
      }

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          mouse: { value: new THREE.Vector2(0.5, 0.5) },
          spherePositions: { value: spherePositions },
          sphereCount: { value: config.sphereCount },
          ambientIntensity: { value: config.ambientIntensity },
          diffuseIntensity: { value: config.diffuseIntensity },
          specularIntensity: { value: config.specularIntensity },
          specularPower: { value: config.specularPower },
          fresnelPower: { value: config.fresnelPower },
          backgroundColor: { value: config.backgroundColor },
          sphereColor: { value: config.sphereColor },
          lightColor: { value: config.lightColor },
          lightPosition: { value: config.lightPosition },
          smoothness: { value: config.smoothness },
          contrast: { value: config.contrast },
          fogDensity: { value: config.fogDensity },
          cursorGlowIntensity: { value: config.cursorGlowIntensity },
          cursorGlowRadius: { value: config.cursorGlowRadius },
          cursorGlowColor: { value: config.cursorGlowColor },
          cursorSphere3D: { value: cursorSphere3D }
        }
      });

      // Geometría de pantalla completa
      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Guardar referencias
      sceneRef.current = scene;
      rendererRef.current = renderer;
    };

    // Manejo del mouse con throttling
    let mouseThrottle = null;
    const handleMouseMove = (event) => {
      if (mouseThrottle) return;
      
      mouseThrottle = setTimeout(() => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        targetMousePosition.x = event.clientX / window.innerWidth;
        targetMousePosition.y = 1 - event.clientY / window.innerHeight;
        
        mouseThrottle = null;
      }, isMobile ? 50 : 16); // Mayor throttling en móviles
    };

    // Manejo del touch con throttling
    let touchThrottle = null;
    const handleTouchMove = (event) => {
      if (touchThrottle) return;
      
      if (event.touches.length > 0) {
        touchThrottle = setTimeout(() => {
          const touch = event.touches[0];
          mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
          
          targetMousePosition.x = touch.clientX / window.innerWidth;
          targetMousePosition.y = 1 - touch.clientY / window.innerHeight;
          
          touchThrottle = null;
        }, 50);
      }
    };

    // Resize
    const handleResize = () => {
      if (!camera || !renderer || !material) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      if (material.uniforms && material.uniforms.resolution) {
        material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
      }
    };

    // Animación con control de FPS
    let lastFrameTime = 0;
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime) => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Control de FPS
      if (currentTime - lastFrameTime < frameInterval) return;
      lastFrameTime = currentTime;
      
      if (!material || !renderer || !scene || !camera) return;

      const elapsed = clock.getElapsedTime();
      
      // Suavizado del mouse (menos frecuente en móviles)
      const lerpFactor = isMobile ? 0.02 : 0.05;
      mousePosition.lerp(targetMousePosition, lerpFactor);
      
      // Actualizar posición del cursor 3D
      cursorSphere3D.set(
        (mousePosition.x - 0.5) * 10,
        (mousePosition.y - 0.5) * 10,
        2
      );

      // Actualizar uniforms
      if (material.uniforms) {
        material.uniforms.time.value = elapsed;
        material.uniforms.mouse.value = mousePosition;
        material.uniforms.cursorSphere3D.value = cursorSphere3D;

        // Animar posiciones de esferas (menos intenso en móviles)
        const spherePositions = material.uniforms.spherePositions.value;
        const animationIntensity = isMobile ? 0.005 : 0.01;
        
        for (let i = 0; i < config.sphereCount * 3; i += 3) {
          spherePositions[i] += Math.sin(elapsed * 0.5 + i) * animationIntensity;
          spherePositions[i + 1] += Math.cos(elapsed * 0.3 + i) * animationIntensity;
          spherePositions[i + 2] += Math.sin(elapsed * 0.7 + i) * (animationIntensity * 0.5);
        }
      }

      renderer.render(scene, camera);
    };

    // Inicializar
    init();

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Comenzar animación
    animate(0);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full"
      style={{ 
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
};
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const MetaballsOriginal = () => {
  const containerRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

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
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isLowPowerDevice = isMobile || navigator.hardwareConcurrency <= 4;
    const devicePixelRatio = Math.min(
      window.devicePixelRatio || 1,
      isMobile ? 1.5 : 2
    );

    // Preset original - usando "holographic"
    const settings = {
      sphereCount: isMobile ? 4 : 6,
      ambientIntensity: 0.12,
      diffuseIntensity: 1.2,
      specularIntensity: 2.5,
      specularPower: 3,
      fresnelPower: 0.8,
      backgroundColor: new THREE.Color(0x0a0a15),
      sphereColor: new THREE.Color(0x050510),
      lightColor: new THREE.Color(0xccaaff),
      lightPosition: new THREE.Vector3(0.9, 0.9, 1.2),
      smoothness: 0.8,
      contrast: 1.6,
      fogDensity: 0.06,
      cursorGlowIntensity: 1.2,
      cursorGlowRadius: 2.2,
      cursorGlowColor: new THREE.Color(0xaa77ff),
      fixedTopLeftRadius: 0.8,
      fixedBottomRightRadius: 0.9,
      smallTopLeftRadius: 0.3,
      smallBottomRightRadius: 0.35,
      cursorRadiusMin: 0.08,
      cursorRadiusMax: 0.15,
      animationSpeed: 0.6,
      movementScale: 1.2,
      mouseSmoothness: 0.1,
      mergeDistance: 1.5,
      mouseProximityEffect: true,
      minMovementScale: 0.3,
      maxMovementScale: 1.0
    };

    // Vertex shader original
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader original (simplificado pero funcional)
    const fragmentShader = `
      precision highp float;
      
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uActualResolution;
      uniform vec2 uMousePosition;
      uniform vec3 uCursorSphere;
      uniform float uCursorRadius;
      uniform int uSphereCount;
      uniform vec3 uBackgroundColor;
      uniform vec3 uSphereColor;
      uniform vec3 uLightColor;
      uniform vec3 uLightPosition;
      uniform float uAmbientIntensity;
      uniform float uDiffuseIntensity;
      uniform float uSpecularIntensity;
      uniform float uSpecularPower;
      uniform float uFresnelPower;
      uniform float uSmoothness;
      uniform float uContrast;
      uniform float uFogDensity;
      uniform float uCursorGlowIntensity;
      uniform float uCursorGlowRadius;
      uniform vec3 uCursorGlowColor;
      uniform float uFixedTopLeftRadius;
      uniform float uFixedBottomRightRadius;
      uniform float uSmallTopLeftRadius;
      uniform float uSmallBottomRightRadius;
      uniform float uAnimationSpeed;
      uniform float uMovementScale;
      uniform float uMergeDistance;
      uniform float uIsMobile;
      uniform float uIsLowPower;
      uniform float uIsSafari;
      uniform float uMinMovementScale;
      uniform float uMaxMovementScale;
      uniform float uMouseProximityEffect;
      
      varying vec2 vUv;
      
      #define PI 3.14159265359
      #define EPSILON 0.001
      #define MAX_DIST 10.0
      
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
      
      float sdSphere(vec3 p, float r) {
        return length(p) - r;
      }
      
      vec3 screenToWorld(vec2 normalizedPos) {
        vec2 uv = normalizedPos * 2.0 - 1.0;
        float aspect = uResolution.x / uResolution.y;
        return vec3(uv.x * aspect * 2.0, uv.y * 2.0, 0.0);
      }
      
      float getDistanceToCenter(vec2 pos) {
        float dist = length(pos - vec2(0.5, 0.5)) * 2.0;
        return smoothstep(0.0, 1.0, dist);
      }
      
      float sceneSDF(vec3 pos) {
        float result = MAX_DIST;
        
        // Esferas fijas
        vec3 topLeftPos = screenToWorld(vec2(0.08, 0.92));
        float topLeft = sdSphere(pos - topLeftPos, uFixedTopLeftRadius);
        
        vec3 smallTopLeftPos = screenToWorld(vec2(0.25, 0.72));
        float smallTopLeft = sdSphere(pos - smallTopLeftPos, uSmallTopLeftRadius);
        
        vec3 bottomRightPos = screenToWorld(vec2(0.92, 0.08));
        float bottomRight = sdSphere(pos - bottomRightPos, uFixedBottomRightRadius);
        
        vec3 smallBottomRightPos = screenToWorld(vec2(0.72, 0.25));
        float smallBottomRight = sdSphere(pos - smallBottomRightPos, uSmallBottomRightRadius);
        
        float t = uTime * uAnimationSpeed;
        
        float dynamicMovementScale = uMovementScale;
        if (uMouseProximityEffect > 0.5) {
          float distToCenter = getDistanceToCenter(uMousePosition);
          float mixFactor = smoothstep(0.0, 1.0, distToCenter);
          dynamicMovementScale = mix(uMinMovementScale, uMaxMovementScale, mixFactor);
        }
        
        // Esferas dinámicas
        int maxIter = uIsMobile > 0.5 ? 4 : (uIsLowPower > 0.5 ? 6 : min(uSphereCount, 10));
        for (int i = 0; i < 10; i++) {
          if (i >= uSphereCount || i >= maxIter) break;
          
          float fi = float(i);
          float speed = 0.4 + fi * 0.12;
          float radius = 0.12 + mod(fi, 3.0) * 0.06;
          float orbitRadius = (0.3 + mod(fi, 3.0) * 0.15) * dynamicMovementScale;
          float phaseOffset = fi * PI * 0.35;
          
          float distToCursor = length(vec3(0.0) - uCursorSphere);
          float proximityScale = 1.0 + (1.0 - smoothstep(0.0, 1.0, distToCursor)) * 0.5;
          orbitRadius *= proximityScale;
          
          vec3 offset;
          if (i == 0) {
            offset = vec3(
              sin(t * speed) * orbitRadius * 0.7,
              sin(t * 0.5) * orbitRadius,
              cos(t * speed * 0.7) * orbitRadius * 0.5
            );
          } else if (i == 1) {
            offset = vec3(
              sin(t * speed + PI) * orbitRadius * 0.5,
              -sin(t * 0.5) * orbitRadius,
              cos(t * speed * 0.7 + PI) * orbitRadius * 0.5
            );
          } else {
            offset = vec3(
              sin(t * speed + phaseOffset) * orbitRadius * 0.8,
              cos(t * speed * 0.85 + phaseOffset * 1.3) * orbitRadius * 0.6,
              sin(t * speed * 0.5 + phaseOffset) * 0.3
            );
          }
          
          vec3 toCursor = uCursorSphere - offset;
          float cursorDist = length(toCursor);
          if (cursorDist < uMergeDistance && cursorDist > 0.0) {
            float attraction = (1.0 - cursorDist / uMergeDistance) * 0.3;
            offset += normalize(toCursor) * attraction;
          }
          
          float movingSphere = sdSphere(pos - offset, radius);
          
          float blend = 0.05;
          if (cursorDist < uMergeDistance) {
            float influence = 1.0 - (cursorDist / uMergeDistance);
            blend = mix(0.05, uSmoothness, influence * influence * influence);
          }
          
          result = smin(result, movingSphere, blend);
        }
        
        float cursorBall = sdSphere(pos - uCursorSphere, uCursorRadius);
        
        float topLeftGroup = smin(topLeft, smallTopLeft, 0.4);
        float bottomRightGroup = smin(bottomRight, smallBottomRight, 0.4);
        
        result = smin(result, topLeftGroup, 0.3);
        result = smin(result, bottomRightGroup, 0.3);
        result = smin(result, cursorBall, uSmoothness);
        
        return result;
      }
      
      vec3 calcNormal(vec3 p) {
        float eps = uIsLowPower > 0.5 ? 0.002 : 0.001;
        return normalize(vec3(
          sceneSDF(p + vec3(eps, 0, 0)) - sceneSDF(p - vec3(eps, 0, 0)),
          sceneSDF(p + vec3(0, eps, 0)) - sceneSDF(p - vec3(0, eps, 0)),
          sceneSDF(p + vec3(0, 0, eps)) - sceneSDF(p - vec3(0, 0, eps))
        ));
      }
      
      float rayMarch(vec3 ro, vec3 rd) {
        float t = 0.0;
        int maxSteps = uIsMobile > 0.5 ? 16 : (uIsSafari > 0.5 ? 16 : 48);
        
        for (int i = 0; i < 48; i++) {
          if (i >= maxSteps) break;
          
          vec3 p = ro + rd * t;
          float d = sceneSDF(p);
          
          if (d < EPSILON) {
            return t;
          }
          
          if (t > 5.0) {
            break;
          }
          
          t += d * (uIsLowPower > 0.5 ? 1.2 : 0.9);
        }
        
        return -1.0;
      }
      
      vec3 lighting(vec3 p, vec3 rd, float t) {
        if (t < 0.0) {
          return vec3(0.0);
        }
        
        vec3 normal = calcNormal(p);
        vec3 viewDir = -rd;
        
        vec3 baseColor = uSphereColor;
        
        vec3 ambient = uLightColor * uAmbientIntensity;
        
        vec3 lightDir = normalize(uLightPosition);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = uLightColor * diff * uDiffuseIntensity;
        
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), uSpecularPower);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
        
        vec3 specular = uLightColor * spec * uSpecularIntensity * fresnel;
        
        float distToCursor = length(p - uCursorSphere);
        if (distToCursor < uCursorRadius + 0.4) {
          float highlight = 1.0 - smoothstep(0.0, uCursorRadius + 0.4, distToCursor);
          specular += uLightColor * highlight * 0.2;
        }
        
        vec3 color = baseColor + ambient + diffuse + specular;
        
        color = pow(color, vec3(uContrast * 0.9));
        color = color / (color + vec3(0.8));
        
        return color;
      }
      
      float calculateCursorGlow(vec3 worldPos) {
        float dist = length(worldPos.xy - uCursorSphere.xy);
        float glow = 1.0 - smoothstep(0.0, uCursorGlowRadius, dist);
        glow = pow(glow, 2.0);
        return glow * uCursorGlowIntensity;
      }
      
      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - uActualResolution.xy) / uActualResolution.xy;
        uv.x *= uResolution.x / uResolution.y;
        
        vec3 ro = vec3(uv * 2.0, -1.0);
        vec3 rd = vec3(0.0, 0.0, 1.0);
        
        float t = rayMarch(ro, rd);
        
        vec3 p = ro + rd * t;
        
        vec3 color = lighting(p, rd, t);
        
        float cursorGlow = calculateCursorGlow(ro);
        vec3 glowContribution = uCursorGlowColor * cursorGlow;
        
        if (t > 0.0) {
          float fogAmount = 1.0 - exp(-t * uFogDensity);
          color = mix(color, uBackgroundColor.rgb, fogAmount * 0.3);
          
          color += glowContribution * 0.3;
          
          gl_FragColor = vec4(color, 1.0);
        } else {
          if (cursorGlow > 0.01) {
            gl_FragColor = vec4(glowContribution, cursorGlow * 0.8);
          } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          }
        }
      }
    `;

    // Inicialización
    const init = () => {
      const container = containerRef.current;
      if (!container) return;

      console.log('Initializing Original Metaballs...');

      // Escena
      scene = new THREE.Scene();

      // Cámara ortográfica como en el original
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;

      // Renderer
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isMobile && !isLowPowerDevice,
          alpha: true,
          powerPreference: isMobile ? "default" : "high-performance",
          preserveDrawingBuffer: false,
          premultipliedAlpha: false
        });

        const pixelRatio = Math.min(devicePixelRatio, isMobile ? 1.5 : 2);
        renderer.setPixelRatio(pixelRatio);

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        renderer.setSize(viewportWidth, viewportHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Estilo del canvas como en el original
        const canvas = renderer.domElement;
        canvas.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 0 !important;
          display: block !important;
        `;
        container.appendChild(canvas);

        console.log('Metaballs renderer created successfully');
      } catch (error) {
        console.error('Error creating metaballs renderer:', error);
        return;
      }

      // Material con shaders originales
      try {
        material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uActualResolution: { value: new THREE.Vector2(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio) },
            uMousePosition: { value: new THREE.Vector2(0.5, 0.5) },
            uCursorSphere: { value: new THREE.Vector3(0, 0, 0) },
            uCursorRadius: { value: (settings.cursorRadiusMin + settings.cursorRadiusMax) / 2 },
            uSphereCount: { value: settings.sphereCount },
            uBackgroundColor: { value: settings.backgroundColor },
            uSphereColor: { value: settings.sphereColor },
            uLightColor: { value: settings.lightColor },
            uLightPosition: { value: settings.lightPosition },
            uAmbientIntensity: { value: settings.ambientIntensity },
            uDiffuseIntensity: { value: settings.diffuseIntensity },
            uSpecularIntensity: { value: settings.specularIntensity },
            uSpecularPower: { value: settings.specularPower },
            uFresnelPower: { value: settings.fresnelPower },
            uSmoothness: { value: settings.smoothness },
            uContrast: { value: settings.contrast },
            uFogDensity: { value: settings.fogDensity },
            uCursorGlowIntensity: { value: settings.cursorGlowIntensity },
            uCursorGlowRadius: { value: settings.cursorGlowRadius },
            uCursorGlowColor: { value: settings.cursorGlowColor },
            uFixedTopLeftRadius: { value: settings.fixedTopLeftRadius },
            uFixedBottomRightRadius: { value: settings.fixedBottomRightRadius },
            uSmallTopLeftRadius: { value: settings.smallTopLeftRadius },
            uSmallBottomRightRadius: { value: settings.smallBottomRightRadius },
            uAnimationSpeed: { value: settings.animationSpeed },
            uMovementScale: { value: settings.movementScale },
            uMergeDistance: { value: settings.mergeDistance },
            uIsMobile: { value: isMobile ? 1.0 : 0.0 },
            uIsLowPower: { value: isLowPowerDevice ? 1.0 : 0.0 },
            uIsSafari: { value: isSafari ? 1.0 : 0.0 },
            uMinMovementScale: { value: settings.minMovementScale },
            uMaxMovementScale: { value: settings.maxMovementScale },
            uMouseProximityEffect: { value: settings.mouseProximityEffect ? 1.0 : 0.0 },
          },
          vertexShader,
          fragmentShader,
          transparent: true
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        console.log('Metaballs shaders compiled successfully');
      } catch (error) {
        console.error('Error creating metaballs shaders:', error);
        return;
      }

      console.log('Original Metaballs initialized successfully');
    };

    // Función screenToWorld igual que en el original
    const screenToWorldJS = (normalizedX, normalizedY) => {
      const uv_x = normalizedX * 2.0 - 1.0;
      const uv_y = normalizedY * 2.0 - 1.0;
      const aspect = window.innerWidth / window.innerHeight;
      return new THREE.Vector3(uv_x * aspect * 2.0, uv_y * 2.0, 0.0);
    };

    // Manejo del mouse con la misma lógica del original
    const handleMouseMove = (event) => {
      // Usar el mismo sistema de coordenadas que el original
      targetMousePosition.x = event.clientX / window.innerWidth;
      targetMousePosition.y = 1.0 - event.clientY / window.innerHeight;

      // Convertir a coordenadas del mundo usando el mismo sistema que las esferas fijas
      const normalizedX = targetMousePosition.x;
      const normalizedY = targetMousePosition.y;
      const worldPos = screenToWorldJS(normalizedX, normalizedY);
      cursorSphere3D.copy(worldPos);
    };

    // Manejo del touch con la misma lógica
    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        targetMousePosition.x = touch.clientX / window.innerWidth;
        targetMousePosition.y = 1.0 - touch.clientY / window.innerHeight;

        const normalizedX = targetMousePosition.x;
        const normalizedY = targetMousePosition.y;
        const worldPos = screenToWorldJS(normalizedX, normalizedY);
        cursorSphere3D.copy(worldPos);
      }
    };

    // Resize
    const handleResize = () => {
      if (!renderer || !material) return;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      renderer.setSize(viewportWidth, viewportHeight);
      
      if (material.uniforms) {
        material.uniforms.uResolution.value.set(viewportWidth, viewportHeight);
        material.uniforms.uActualResolution.value.set(
          viewportWidth * devicePixelRatio, 
          viewportHeight * devicePixelRatio
        );
      }
    };

    // Animación
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (!material || !renderer || !scene || !camera) return;

      const elapsed = clock.getElapsedTime();
      
      // Suavizado del mouse como en el original
      mousePosition.lerp(targetMousePosition, settings.mouseSmoothness);
      
      // El cursorSphere3D ya se actualiza en handleMouseMove con la posición correcta
      // No necesitamos recalcularlo aquí

      // Actualizar uniforms
      if (material.uniforms) {
        material.uniforms.uTime.value = elapsed;
        material.uniforms.uMousePosition.value = mousePosition;
        material.uniforms.uCursorSphere.value = cursorSphere3D;
      }

      renderer.render(scene, camera);
    };

    // Inicializar
    try {
      init();
      animate();
    } catch (error) {
      console.error('Error initializing Original Metaballs:', error);
    }

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      
      if (renderer && containerRef.current) {
        try {
          containerRef.current.removeChild(renderer.domElement);
          renderer.dispose();
        } catch (error) {
          console.warn('Error disposing metaballs renderer:', error);
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: '#050505' // Fallback
      }}
    />
  );
};
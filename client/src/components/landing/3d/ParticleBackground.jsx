import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';

function Particles({ count = 3000, mobile = false }) {
    const ref = useRef();
    const { opacity, size } = mobile
        ? { opacity: 0.4, size: 0.008 }
        : { opacity: 0.25, size: 0.005 };

    // Generate positions once
    const sphere = useMemo(() => {
        const data = new Float32Array(count * 3);
        random.inSphere(data, { radius: 2.8 }); // Slightly wider radius
        return data;
    }, [count]);

    // Soft Glow Texture
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        // Soft radial gradient, very subtle
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
    }, []);

    useFrame((state, delta) => {
        if (!ref.current) return;

        // 1. Slow Corporate Rotation
        ref.current.rotation.x -= delta / 80;
        ref.current.rotation.y -= delta / 100;

        // 2. Mouse Parallax (Damped)
        // Lerp functionality manually for performance
        const damping = 2;
        const xTarget = state.pointer.x * 0.1; // Minimal influence
        const yTarget = state.pointer.y * 0.1;

        ref.current.rotation.x += (yTarget - ref.current.rotation.x) * damping * delta;
        ref.current.rotation.y += (xTarget - ref.current.rotation.y) * damping * delta;
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={true} >
                <PointMaterial
                    transparent
                    map={texture}
                    alphaMap={texture}
                    color="#cbd5e1" // Slate-300
                    size={size}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={opacity}
                    alphaTest={0.01}
                    blending={THREE.AdditiveBlending} // Keep subtle add for "glow" feeling but controlled by opacity
                />
            </Points>
        </group>
    );
}

const ParticleWaveBackground = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        // 1. Check Mobile
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // 2. Check Reduced Motion
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduceMotion(motionQuery.matches);
        const handleMotionChange = (e) => setReduceMotion(e.matches);
        motionQuery.addEventListener('change', handleMotionChange);

        return () => {
            window.removeEventListener('resize', checkMobile);
            motionQuery.removeEventListener('change', handleMotionChange);
        };
    }, []);

    // Performance params based on device
    const particleCount = isMobile ? 800 : 3200;
    const dpr = isMobile ? 1 : [1, 2];

    return (
        <div className="absolute inset-0 z-0 w-full h-full pointer-events-none bg-[#02040a]">
            {/* R3F Canvas */}
            {!reduceMotion && (
                <Canvas
                    camera={{ position: [0, 0, 1], fov: 75 }}
                    dpr={dpr}
                    gl={{
                        antialias: false, // Performance boost
                        powerPreference: "high-performance",
                        alpha: false, // We handle background manually
                        stencil: false,
                        depth: false // No depth testing needed for background particles
                    }}
                >
                    <Particles count={particleCount} mobile={isMobile} />
                    {/* Soft Fog for Depth */}
                    <fog attach="fog" args={['#02040a', 2.5, 5.5]} />
                </Canvas>
            )}

            {/* Static Fallback for Reduced Motion */}
            {reduceMotion && (
                <div className="absolute inset-0 bg-[url('/assets/static-noise.png')] opacity-20" />
            )}

            {/* Premium Overlays / Masks */}

            {/* 1. Base Gradient (Bottom Up) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-transparent to-transparent opacity-90" />

            {/* 2. Text Readability Mask (Left Side) - CRITICAL for readability */}
            <div className="absolute inset-y-0 left-0 w-full lg:w-1/2 bg-gradient-to-r from-[#02040a] via-[#02040a]/60 to-transparent z-10 pointer-events-none" />

            {/* 3. Right Side Vignette (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#02040a]/80 via-transparent to-[#02040a]/30" />

        </div>
    );
};

export default ParticleWaveBackground;

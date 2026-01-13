import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';
import { motion } from 'framer-motion';

function Particles({ count = 3000, mobile = false }) {
    const ref = useRef();
    const { opacity, size } = mobile
        ? { opacity: 0.55, size: 0.009 }
        : { opacity: 0.35, size: 0.006 };

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

const ParticleWaveBackground = ({ activeColor = '#10b981' }) => {
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
        <div className="absolute inset-0 z-0 w-full h-full pointer-events-none bg-[#02040a] overflow-hidden">

            {/* 0. Dynamic Atmosphere (Cinematic Glow) */}
            <motion.div
                animate={{ backgroundColor: activeColor }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-[0.25] z-0 mix-blend-screen pointer-events-none"
            />
            <motion.div
                animate={{ backgroundColor: activeColor }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
                className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-[0.15] z-0 mix-blend-screen pointer-events-none"
            />
            {/* Center Fill Light to remove "Void" feeling */}
            <div
                className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[150px] bg-indigo-500/10 opacity-20 z-0 mix-blend-screen pointer-events-none"
            />

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

            {/* Cinematic Grain Overlay */}
            <div
                className="absolute inset-0 z-[5] pointer-events-none opacity-[0.03] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            {/* Premium Overlays / Masks */}

            {/* 1. Base Gradient (Bottom Up) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-transparent to-transparent opacity-90 z-[10]" />

            {/* 2. Text Readability Mask (Left Side) - CRITICAL for readability */}
            <div className="absolute inset-y-0 left-0 w-full lg:w-1/2 bg-gradient-to-r from-[#02040a] via-[#02040a]/60 to-transparent z-[10] pointer-events-none" />

            {/* 3. Right Side Vignette (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#02040a]/80 via-transparent to-[#02040a]/30 z-[10]" />

        </div>
    );
};

export default ParticleWaveBackground;

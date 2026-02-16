import { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import ParticleWaveBackground from './3d/ParticleBackground';
import LivingDashboard from './hero/LivingDashboard';
import FloatingCard from './hero/FloatingCard';
import { LandingButton } from './ui/LandingButton';

const sectors = [
    {
        id: 'retail',
        label: 'Retail',
        accent: 'from-emerald-400 to-cyan-500',
        glow: '#10b981',
        description: 'Gestiona tus puntos de venta, inventario y caja en tiempo real. Todo lo que tu tienda necesita para vender más sin perder el control.'
    },
    {
        id: 'services',
        label: 'Servicios',
        accent: 'from-blue-400 to-indigo-500',
        glow: '#3b82f6',
        description: 'Administra proyectos, cotizaciones y facturación sin complicaciones. La herramienta ideal para consultoras y agencias que buscan orden.'
    },
    {
        id: 'distribution',
        label: 'Distribución',
        accent: 'from-amber-400 to-orange-500',
        glow: '#f59e0b',
        description: 'Optimiza tu logística, controla múltiples almacenes y agiliza tus despachos. Potencia tu cadena de suministro con datos precisos.'
    }
];

const Hero = ({ isPocketMode }) => {
    const [activeSector, setActiveSector] = useState('retail');
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    // Find active sector data
    const currentSector = sectors.find(s => s.id === activeSector) || sectors[0];

    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-landing-primary flex flex-col justify-center pt-32 pb-20">
            {/* 1. Background Layer */}
            <ParticleWaveBackground activeColor={currentSector.glow} />

            <div className="container mx-auto px-4 z-10 relative grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* 2. Content Layer (Left) */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-left space-y-10"
                >
                    {/* Sector Selector - Hidden in Pocket Mode */}
                    {!isPocketMode && (
                        <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            {sectors.map((sector) => (
                                <button
                                    key={sector.id}
                                    onClick={() => setActiveSector(sector.id)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeSector === sector.id
                                        ? 'bg-white/10 text-white shadow-inner'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {sector.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {isPocketMode ? (
                        <h1 className="text-5xl lg:text-7xl font-bold font-manrope text-white leading-[1.1] tracking-tight text-balance">
                            Tu negocio en{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 pb-2">
                                tu bolsillo.
                            </span>
                        </h1>
                    ) : (
                        <h1 className="text-5xl lg:text-7xl font-bold font-manrope text-white leading-[1.1] tracking-tight text-balance">
                            Control total que{' '}
                            <motion.span
                                key={activeSector}
                                initial={{ opacity: 0.8 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className={`text-transparent bg-clip-text bg-gradient-to-r ${currentSector.accent} pb-2`}
                            >
                                impulsa
                            </motion.span>
                            <br />
                            tu crecimiento.
                        </h1>
                    )}

                    <motion.p
                        key={isPocketMode ? "pocket-desc" : activeSector + "desc"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-lg lg:text-xl text-gray-400 text-pretty max-w-xl font-light leading-relaxed min-h-[84px]"
                    >
                        {isPocketMode
                            ? "Sistema compacto para emprendedores. Vende, controla y crece con la agilidad que tu negocio necesita."
                            : currentSector.description}
                    </motion.p>

                    <div className="space-y-6">


                        {/* New Microcopy Trust Indicators */}
                        <div className="flex items-center gap-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <span className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${isPocketMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>Implementación rápida</span>
                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Soporte humano</span>
                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>Auditoría total</span>
                        </div>
                    </div>
                </motion.div>

                {/* 3. Visual Layer (Right) - Dashboard + Floating Cards */}
                <div className="relative h-[600px] flex items-center justify-center perspective-[2000px]">
                    {/* Animated Dashboard Mockup */}
                    <motion.div
                        style={{ y: y2, rotateX: 5, rotateY: -5 }}
                        className="relative z-10 w-full max-w-[650px]"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <LivingDashboard activeSector={activeSector} isPocketMode={isPocketMode} />
                    </motion.div>

                    {/* Floating Cards (Parallax Elements) - Only in Standard Mode */}
                    {!isPocketMode && (
                        <>
                            <motion.div style={{ y: y1 }} className="absolute z-20 top-12 -right-4 lg:right-0 shadow-2xl">
                                <FloatingCard
                                    icon={TrendingUp}
                                    label="Ventas Semanales"
                                    value="$54,230"
                                    trend="+12%"
                                    trendUp={true}
                                    delay={0.5}
                                    className="animate-float-slow"
                                />
                            </motion.div>

                            <motion.div style={{ y: y1 }} className="absolute z-20 bottom-20 -left-6 lg:left-0 shadow-2xl">
                                <FloatingCard
                                    icon={AlertTriangle}
                                    label="Stock Crítico"
                                    value="5 Items"
                                    trend="Requiere Atención"
                                    trendUp={false}
                                    delay={0.7}
                                    className="animate-float-slower"
                                />
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Hero;
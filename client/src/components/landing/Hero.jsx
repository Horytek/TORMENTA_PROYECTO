import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Zap, Bot, X, ExternalLink } from "lucide-react";
import heroShortcuts from "../../assets/images/hero-shortcuts.png";
import heroChatbot from "../../assets/images/hero-chatbot.png";

import { InvitationModal } from "./InvitationModal";
import { ContactModal } from "./ContactModal";
import { useTheme } from "../../components/ui/theme-provider";
import dashboardLight from "../../assets/images/dashboard3.jpeg";
import dashboardDark from "../../assets/images/dashboard4.jpeg";
import styles from "../../styles/landing.module.css";

// Nuevo componente para las tarjetas de características
const FeatureCard = ({ icon: Icon, label, description, delay, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay }}
        onClick={onClick}
        className="flex items-start gap-4 p-4 rounded-2xl bg-bg-dark-2 border border-primary-color/20 backdrop-blur-sm hover:border-primary-color/50 transition-all cursor-pointer w-full sm:w-auto hover:bg-bg-dark-3 hover:scale-[1.02] group"
    >
        <div className="p-3 rounded-xl bg-primary-color/10 text-primary-color flex-shrink-0 group-hover:bg-primary-color/20 transition-colors">
            <Icon size={24} />
        </div>
        <div>
            <h4 className="text-primary-text font-bold text-lg mb-1 group-hover:text-primary-color transition-colors">{label}</h4>
            <p className="text-secondary-text text-sm leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

export const Hero = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const { theme } = useTheme();
    const [isDarkPreview, setIsDarkPreview] = useState(false);

    useEffect(() => {
        const isSystemDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDarkPreview(isSystemDark);
    }, [theme]);

    const currentDashboard = isDarkPreview ? dashboardDark : dashboardLight;

    const handleScrollToPricing = () => {
        const pricingSection = document.getElementById("pricing");
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section
            className={`landing-hero w-full min-h-[90vh] flex justify-center items-center pb-20 pt-28 md:pt-32 lg:pt-40 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-28 2xl:px-40`}
            id="home"
            style={{
                background: 'transparent',
            }}
        >
            <div className="w-full max-w-[1400px] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">

                {/* Columna Izquierda: Texto, Botones y Características */}
                <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-secondary-color text-sm sm:text-base mb-4 font-bold uppercase tracking-wider">
                            Descubre un nuevo flujo empresarial
                        </h3>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-primary-text leading-tight mb-6">
                            Solución integral con <span className="text-primary-color">reportes dinámicos</span>
                        </h1>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mb-10"
                    >
                        <h2 className="text-secondary-text text-base sm:text-lg md:text-xl max-w-2xl">
                            Integra, controla y optimiza todos los procesos de tu empresa. Potenciado por un asistente inteligente para decisiones en tiempo real.
                        </h2>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="flex flex-wrap gap-4 mb-12"
                    >
                        <button
                            className="px-8 h-12 rounded-xl font-bold bg-primary-color text-primary-text flex justify-center items-center cursor-pointer transition hover:bg-primary-color/90 shadow-lg shadow-primary-color/20"
                            onClick={handleScrollToPricing}
                            aria-label="Empezar"
                        >
                            Empezar
                        </button>
                        <button
                            onClick={() => setIsContactModalOpen(true)}
                            className="px-8 h-12 rounded-xl font-bold text-primary-text border border-primary-color/30 flex justify-center items-center cursor-pointer bg-bg-dark-2 hover:bg-bg-dark-3 hover:border-primary-color transition text-center backdrop-blur-sm"
                            aria-label="Live demo"
                        >
                            Live demo
                        </button>
                    </motion.div>

                    {/* Nuevas Tarjetas de Características */}
                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                        <FeatureCard
                            icon={Zap}
                            label="Atajos de función"
                            description="Accede rápidamente a cálculos y mini-reportes sin perder el foco."
                            delay={0.2}
                            onClick={() => setSelectedFeature({
                                icon: Zap,
                                label: "Atajos de función",
                                description: "Optimiza tu flujo de trabajo con accesos directos inteligentes. Realiza cálculos rápidos, consulta mini-reportes y accede a funciones clave sin navegar fuera de tu pantalla actual. Diseñado para la máxima eficiencia operativa.",
                                image: heroShortcuts
                            })}
                        />
                        <FeatureCard
                            icon={Bot}
                            label="Asistente IA"
                            description="Tu copiloto inteligente. Pregunta y obtén respuestas al instante."
                            delay={0.25}
                            onClick={() => setSelectedFeature({
                                icon: Bot,
                                label: "Asistente IA",
                                description: "Potencia tu toma de decisiones con nuestro asistente basado en inteligencia artificial. Analiza tendencias, predice inventarios y responde consultas complejas sobre tu negocio en lenguaje natural.",
                                image: heroChatbot
                            })}
                        />
                    </div>
                </div>

                {/* Columna Derecha: Imagen del Dashboard */}
                <div className="w-full lg:w-1/2 relative mt-12 lg:mt-0">
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                        className="relative z-10"
                    >
                        <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-color to-secondary-color opacity-30 blur-xl transition-all duration-500 group-hover:opacity-50 ${styles.heroDashboardBorderGradient}`}></div>
                        <img
                            src={currentDashboard}
                            alt="Dashboard image"
                            className={`w-full rounded-xl border border-main-border/20 relative z-10 shadow-2xl shadow-primary-color/10 transition-all duration-500 hover:scale-[1.02]`}
                        />

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setIsDarkPreview(!isDarkPreview)}
                            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white hover:bg-black/50 transition-colors flex items-center gap-2"
                            aria-label="Toggle dashboard theme"
                        >
                            {isDarkPreview ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                    </motion.div>

                    {/* Elementos decorativos de fondo */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-color/5 blur-[100px] rounded-full -z-10"></div>
                </div>
            </div>

            {isModalOpen && (
                <InvitationModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
            )}

            {/* Modal de Detalle de Característica */}
            <AnimatePresence>
                {selectedFeature && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedFeature(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bg-dark-1 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                        >
                            {/* Imagen */}
                            <div className="w-full md:w-2/3 bg-black/20 p-8 flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-color/5 to-secondary-color/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <img
                                    src={selectedFeature.image}
                                    alt={selectedFeature.label}
                                    className="w-full h-full object-contain drop-shadow-2xl transform transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>

                            {/* Contenido */}
                            <div className="w-full md:w-1/3 p-8 flex flex-col bg-bg-dark-2 relative">
                                <button
                                    onClick={() => setSelectedFeature(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>

                                <div className="w-12 h-12 rounded-xl bg-primary-color/10 flex items-center justify-center text-primary-color mb-6">
                                    <selectedFeature.icon size={28} />
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-4">{selectedFeature.label}</h3>
                                <p className="text-gray-300 leading-relaxed mb-8">
                                    {selectedFeature.description}
                                </p>

                                <div className="mt-auto">
                                    <button
                                        onClick={() => {
                                            setSelectedFeature(null);
                                            setIsContactModalOpen(true);
                                        }}
                                        className="w-full py-3 rounded-xl bg-primary-color text-white font-bold hover:bg-primary-color/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Probar ahora <ExternalLink size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                title="Solicitar Demo - HoryCore"
                type="demo"
            />
        </section>
    );
};
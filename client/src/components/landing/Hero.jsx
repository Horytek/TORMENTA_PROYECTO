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
            className={`landing-hero w-full min-h-[90vh] flex flex-col justify-center items-center pb-20 pt-28 md:pt-32 lg:pt-40 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-28 2xl:px-40`}
            id="home"
            style={{
                background: 'transparent',
            }}
        >
            {/* Contenido Centralizado */}
            <div className="w-full flex flex-col items-center text-center z-20 mt-8 mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6"
                >
                    <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-gray-300 text-xs font-medium backdrop-blur-sm flex items-center gap-2 hover:bg-white/10 transition-colors">
                        <Bot size={14} className="text-primary-color" />
                        Potenciado por IA
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
                        Control total. <br />
                        <span className="text-gray-400">Crecimiento sin límites.</span>
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8 max-w-2xl mx-auto"
                >
                    <h2 className="text-gray-400 text-base sm:text-lg leading-relaxed font-light">
                        Centraliza operaciones, ventas y finanzas en una plataforma viva.
                        Deja que la IA de HoryCore se encargue de los datos.
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="flex flex-wrap justify-center gap-4"
                >
                    <button
                        className="px-6 py-2.5 rounded-lg font-medium bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                        onClick={handleScrollToPricing}
                        aria-label="Comienza Gratis"
                    >
                        Comienza Gratis <ExternalLink size={16} />
                    </button>
                    <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="px-6 py-2.5 rounded-lg font-medium text-white border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
                        aria-label="Agendar un Demo"
                    >
                        <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-white border-b-[3px] border-b-transparent ml-0.5"></div>
                        </div>
                        Ver Demo
                    </button>
                </motion.div>
            </div>

            {/* Imagen del Dashboard Minimalista */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full max-w-[1000px] relative z-10 mt-4"
            >
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/50">
                    <img
                        src={dashboardDark}
                        alt="Dashboard HoryCore Dark Mode"
                        className="w-full h-auto"
                    />
                    {/* Sutil gradiente inferior */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent opacity-80"></div>
                </div>
            </motion.div>

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
import { useState } from "react";
import { motion } from "framer-motion";

import { InvitationModal } from "./InvitationModal";
import dashboard from "../../assets/images/dashboard2.jpg";
import styles from "../../styles/landing.module.css";

export const Hero = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Scroll suave a la sección de Precios
    const handleScrollToPricing = () => {
        const pricingSection = document.getElementById("pricing");
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section
            className={`landing-hero w-screen flex justify-center items-center mb-[28vw] md:mb-[18vw] lg:mb-[10vw] xl:mb-[13vw] 2xl:mb-60 pb-24 sm:pb-32 md:pb-44 lg:pb-0`}
            id="home"
            style={{
                background: 'transparent',
                backdropFilter: 'blur(1px)',
                WebkitBackdropFilter: 'blur(1px)'
            }}
        >
            <div className="w-full md:w-[800px] xl:w-[900px] flex flex-col justify-center items-center pt-16 md:pt-16 lg:pt-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h3 className="text-secondary-color text-sm sm:text-base mb-6 sm:mt-24 mt-16 font-bold">
                        Descubre un nuevo flujo empresarial
                    </h3>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                >
                    <div className="text-5xl sm:text-6xl lg:text-7xl xl:text-7xl font-bold tracking-wide text-primary-text px-8 sm:px-8 md:px-20 lg:px-4">
                        <h1 className="inline md:hidden">Solución integral</h1>
                        <h1 className="hidden md:inline">Solución integral</h1>
                    </div>
                    <h1 className="mt-2 sm:mt-2 text-4xl sm:text-6xl lg:text-7xl xl:text-7xl font-bold tracking-wide text-primary-text px-8 sm:px-20 md:px-24 lg:px-24">
                        para operaciones clave
                    </h1>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <h2 className="text-secondary-text text-sm lg:text-base xl:text-lg sm:text-base mt-10 px-12 sm:px-48">
                        Integra, controla y optimiza todos los procesos de tu empresa.
                    </h2>

                    {/* Línea decorativa */}
                    <div className="w-32 h-1 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mt-8"></div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                >
                    <div className="flex flex-col gap-2 sm:flex-row mt-14 mb-24 sm:mb-40 justify-center">
                        <button
                            className="w-64 sm:w-52 h-12 mr-0 sm:mr-4 lg:mr-6 mb-2 sm:mb-0 rounded-lg font-bold bg-primary-color text-primary-text flex justify-center items-center cursor-pointer transition hover:bg-[#7274f3]"
                            onClick={handleScrollToPricing}
                            aria-label="Empezar"
                        >
                            Empezar
                        </button>
                        <a
                            href="https://horytekd-davist-tests.azurewebsites.net/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-64 sm:w-52 h-12 rounded-xl font-bold text-primary-text border border-solid flex justify-center items-center cursor-pointer bg-bg-dark-2 hover:bg-bg-dark-3 border-primary-color transition text-center no-underline"
                            aria-label="Live demo"
                        >
                            Live demo
                        </a>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10, zIndex: 20 }}
                    animate={{ opacity: 1, y: 0, zIndex: 20 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                >
                    <div className="relative w-screen flex justify-center">
                        <img
                            src={dashboard}
                            alt="Dashboard image"
                            className={`w-4/5 2xl:w-[1200px] mx-auto absolute z-10 rounded-xl border border-main-border ${styles.heroDashboardBorderGradient} lg:top-6 xl:top-0`}
                        />
                    </div>
                </motion.div>
                <div className="relative w-screen flex justify-center">
                    <div 
                        className={`${styles.heroShapeDivider} mt-4 sm:mt-16 md:mt-52 hidden lg:block`}
                        style={{
                            backgroundColor: 'rgba(38, 39, 43, 0.5)',
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        <svg
                            data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1200 120"
                            preserveAspectRatio="none"
                            style={{ background: 'transparent' }}
                        >
                            <path
                                d="M1200 0L0 0 598.97 114.72 1200 0z"
                                style={{ 
                                    fill: 'rgba(38, 39, 43, 0.5)'
                                }}
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <InvitationModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
            )}
        </section>
    );
};
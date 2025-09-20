import React from 'react';
import { motion } from "framer-motion";

export const ContactoHero = () => {
  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 pt-20">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary-color/5 to-primary-color/5"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary-color/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-tr from-primary-color/20 to-transparent rounded-full blur-2xl"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10 flex justify-center px-2 sm:px-4 py-24">
        <div className="w-full md:w-10/12 lg:w-[1200px] 2xl:w-[1400px]">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center bg-gradient-to-r from-secondary-color/20 to-primary-color/20 rounded-full px-6 py-3 mb-8 border border-secondary-color/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-2 h-2 bg-secondary-color rounded-full mr-3 animate-pulse"></div>
              <span className="text-secondary-color font-semibold text-sm">Estamos aquí para ayudarte</span>
            </motion.div>
            
            {/* Título principal */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <span className="bg-gradient-to-r from-secondary-color to-primary-color bg-clip-text text-transparent">
                Contáctanos
              </span>{" "}
              hoy mismo
            </motion.h1>
            
            {/* Subtítulo */}
            <motion.p 
              className="text-xl md:text-2xl text-secondary-text max-w-4xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Nuestro equipo de expertos está listo para resolver tus dudas y ayudarte a transformar tu empresa con{" "}
              <span className="text-white font-semibold">HoryCore ERP</span>.
            </motion.p>
            
            {/* Línea decorativa */}
            <motion.div 
              className="w-32 h-1 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "8rem" }}
              transition={{ duration: 0.8, delay: 0.8 }}
            ></motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Elementos decorativos adicionales */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary-color/50 to-transparent"></div>
    </section>
  );
};

import React from 'react';
import { motion } from "framer-motion";
import { MessageSquareText, ChevronDown } from "lucide-react";

export const ContactoHero = () => {
  return (
    <section className="relative w-full min-h-[60vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-8 hover:bg-indigo-500/15 transition-colors cursor-default"
        >
          <MessageSquareText className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest">
            Hablemos de Negocios
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight font-manrope leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Contáctanos <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Hoy Mismo
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Nuestro equipo de expertos está listo para resolver tus dudas y ayudarte a transformar tu empresa con <span className="text-white font-medium">HoryCore ERP</span>.
        </motion.p>

      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/20 animate-bounce"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <ChevronDown size={24} />
      </motion.div>

    </section>
  );
};

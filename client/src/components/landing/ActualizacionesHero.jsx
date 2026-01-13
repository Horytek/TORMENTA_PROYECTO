import { motion } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";

export const ActualizacionesHero = () => {
  return (
    <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">

      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-indigo-600/10 blur-[150px] rounded-full" />
        {/* Bottom accents */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-8 hover:bg-indigo-500/15 transition-colors cursor-default"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest">
            Historial de Versiones
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight font-manrope leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Actualizaciones <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            HoryCore
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Mantente al día con las últimas mejoras, correcciones y funcionalidades que
          agregamos constantemente a nuestro sistema ERP líder.
        </motion.p>

      </div>

      {/* Scroll Indicator - Bottom Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-xs text-white/30 uppercase tracking-widest font-medium">Ver Historial</span>
        <ChevronDown className="w-5 h-5 text-white/30 animate-bounce" />
      </motion.div>

    </section>
  );
};

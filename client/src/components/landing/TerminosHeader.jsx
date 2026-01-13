import { motion } from "framer-motion";
import { Scale, ChevronDown } from "lucide-react";

export const TerminosHeader = () => {
  return (
    <section className="relative w-full min-h-[60vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">

      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full" />
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
          <Scale className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest">
            Marco Legal
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight font-manrope leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Términos y <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Condiciones
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Transparencia y claridad en el uso de nuestros servicios y la plataforma <span className="text-white font-medium">HoryCore</span>.
        </motion.p>

      </div>

    </section>
  );
};
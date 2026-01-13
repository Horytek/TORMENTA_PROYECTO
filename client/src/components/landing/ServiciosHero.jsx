import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const ServiciosHero = () => {
  return (
    <section className="w-full relative overflow-hidden pt-32 pb-20">

      {/* Contenido principal */}
      <div className="relative z-10 flex justify-center px-4 w-full">
        <div className="w-full max-w-5xl text-center">

          {/* Badge - Matching AboutHero Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-8 hover:bg-indigo-500/15 transition-colors cursor-default"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest">
              Sistema Integrado
            </span>
          </motion.div>

          {/* Title - Matching AboutHero Style */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tight font-manrope leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Control total de <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              tu negocio
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light mb-12"
          >
            HoryCore unifica Facturación, Inventarios, Contabilidad y RR.HH. en una sola plataforma cloud. Cumplimiento SUNAT garantizado.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/60 font-medium"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Facturación Electrónica
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Libros PLE 5.0
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Multi-almacén
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
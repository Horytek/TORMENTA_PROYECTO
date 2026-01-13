import { motion } from "framer-motion";

export const ServiciosHero = () => {
  return (
    <section className="w-full relative overflow-hidden pt-32 pb-20">

      {/* Contenido principal */}
      <div className="relative z-10 flex justify-center px-4 w-full">
        <div className="w-full max-w-5xl text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-secondary-color/10 border border-secondary-color/20 text-secondary-color text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md hover:bg-secondary-color/20 transition-colors cursor-default"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-color animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            Sistema Integrado de Gestión
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-400 tracking-tight leading-[1.1] mb-8"
          >
            Control total de tu negocio.<br />
            <span className="text-white/40">Sin complicaciones.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-secondary-text max-w-3xl mx-auto leading-relaxed mb-10"
          >
            HoryCore unifica <span className="text-white font-medium">Facturación</span>, <span className="text-white font-medium">Inventarios</span>, <span className="text-white font-medium">Contabilidad</span> y <span className="text-white font-medium">RR.HH.</span> en una sola plataforma cloud. Cumplimiento SUNAT garantizado y toma de decisiones en tiempo real.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/60 font-medium"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Facturación Electrónica OSE/PSE
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Libros Electrónicos PLE 5.0
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Multi-almacén Real
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
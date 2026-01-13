import React from 'react';
import { motion } from "framer-motion";

export const HistorialVersiones = () => {
  return (
    <section className="w-full py-24 bg-transparent relative">
      <div className="flex justify-center px-4">
        <div className="w-full xl:w-[1280px]">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-2">Evolución de la Plataforma</h2>
            <p className="text-secondary-text">Mejora continua basada en feedback real.</p>
          </motion.div>

          {/* Versión 2.0 - ACTUAL */}
          <motion.div
            className="group relative bg-white/5 backdrop-blur-md p-8 lg:p-12 rounded-3xl border border-white/10 overflow-hidden mb-12 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Subtle Glow Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary-color/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Header Info */}
              <div className="lg:col-span-4">
                <div className="inline-flex items-center gap-2 bg-secondary-color/10 border border-secondary-color/20 text-secondary-color px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
                  <span className="w-2 h-2 rounded-full bg-secondary-color animate-pulse"></span>
                  Versión Actual
                </div>
                <h3 className="text-4xl font-bold text-white mb-2">HoryCore 2.0</h3>
                <p className="text-white/60 text-sm mb-6">Lanzamiento: Octubre 2025</p>
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                  La actualización más grande hasta la fecha. Incorporando inteligencia artificial para automatizar la toma de decisiones.
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">⚡</div>
                    <span>3x Más rápido</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">🔒</div>
                    <span>Encriptación militar</span>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Chatbot IA", desc: "Asistente virtual 24/7 para consultas operativas.", icon: "🤖" },
                    { title: "Dashboard Híbrido", desc: "Visualización de datos en tiempo real personalizable.", icon: "📊" },
                    { title: "Facturación Offline", desc: "Sigue vendiendo aunque se caiga el internet.", icon: "📡" },
                    { title: "API Abierta", desc: "Integraciones más fáciles con terceros.", icon: "🔌" }
                  ].map((feature, i) => (
                    <div key={i} className="bg-black/20 p-6 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                      <div className="text-2xl mb-3">{feature.icon}</div>
                      <h4 className="text-white font-bold mb-1">{feature.title}</h4>
                      <p className="text-sm text-secondary-text">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Versión 1.0 - Legacy (Subtle) */}
          <motion.div
            className="opacity-50 hover:opacity-100 transition-opacity bg-transparent border border-white/5 border-dashed p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.5 }}
            viewport={{ once: true }}
          >
            <div>
              <h4 className="text-xl font-bold text-white mb-1">Versión 1.0 (Legacy)</h4>
              <p className="text-sm text-secondary-text">La base fundacional del sistema.</p>
            </div>
            <div className="text-xs font-mono text-white/30 border border-white/10 px-3 py-1 rounded">2024</div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

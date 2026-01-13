import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { Zap, Shield, Smartphone, ArrowRight } from "lucide-react";

export const HistorialVersiones = () => {
  return (
    <section className="w-full py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="flex items-center gap-6 mb-16 w-full">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-manrope tracking-tight leading-none whitespace-nowrap">
            Evolución de la Plataforma
          </h2>
          <div className="h-[1px] bg-white/10 w-full rounded-full relative overflow-hidden flex-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
          </div>
        </div>

        {/* Versión 2.0 - Featured */}
        <GlassCard className="!bg-[#0A0B10]/80 p-8 md:p-12 mb-16 relative overflow-hidden group">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Versión Actual</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 font-manrope">HoryCore 2.0</h3>
              <p className="text-xl text-white/60 mb-8 font-light leading-relaxed">
                La actualización más significativa hasta la fecha. Incorporando inteligencia artificial,
                arquitectura de microservicios y una interfaz totalmente renovada.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-white">3x Más Rápido</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-white">Seguridad Militar</span>
                </div>
              </div>
            </div>

            {/* Visual Representation of V2.0 Features */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Chatbot IA", desc: "Asistente 24/7", icon: "🤖" },
                { title: "Dashboard Híbrido", desc: "Datos en tiempo real", icon: "📊" },
                { title: "Facturación Offline", desc: "Sin interrupciones", icon: "📡" },
                { title: "API Abierta", desc: "Integraciones fáciles", icon: "🔌" }
              ].map((feat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="text-3xl mb-3">{feat.icon}</div>
                  <h4 className="font-bold text-white mb-1">{feat.title}</h4>
                  <p className="text-xs text-white/50">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Legacy Version (Subtle) */}
        <div className="opacity-60 hover:opacity-100 transition-opacity duration-300">
          <div className="w-full p-8 border border-dashed border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Versión 1.0 (Legacy)</h4>
              <p className="text-sm text-white/50">La base fundacional del sistema. Enfocado en estabilidad y core features.</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-white/5 text-xs font-mono text-white/40 border border-white/5">
              Lanzamiento 2024
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { Sparkles, ArrowRight } from "lucide-react";

export const ProximasActualizaciones = () => {
  return (
    <section className="w-full py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-6 mb-16 w-full">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-manrope tracking-tight leading-none whitespace-nowrap">
            Próximas Actualizaciones
          </h2>
          <div className="h-[1px] bg-white/10 w-full rounded-full relative overflow-hidden flex-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
          </div>
        </div>

        {/* Next Version Highlight Card */}
        <GlassCard className="!bg-[#0A0B10] p-10 md:p-12 border-indigo-500/30 overflow-hidden relative group">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-1 font-manrope">Versión 4.3.0</h3>
                  <p className="text-indigo-400 font-bold text-sm uppercase tracking-wider">Octubre 2025</p>
                </div>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest">
                Próximamente
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/5 mb-8">
              <p className="text-lg text-white/80 font-light leading-relaxed">
                Estamos desarrollando una versión revolucionaria con <span className="text-indigo-400 font-bold">Reportes Generados por IA</span>.
                Simplemente pide lo que necesitas en lenguaje natural y deja que HoryCore haga el resto.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Reportes con IA", desc: "Generación automática con lenguaje natural." },
                { title: "Análisis Inteligente", desc: "Insights y tendencias detectados por IA." },
                { title: "Visualización Dinámica", desc: "Gráficos auto-ajustables a tus datos." },
                { title: "Exportación Flexible", desc: "PDF, Excel y PPTX nativos." }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#0F111A] border border-white/5 flex items-start gap-4 hover:border-indigo-500/30 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-white/40 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </GlassCard>

      </div>
    </section>
  );
};

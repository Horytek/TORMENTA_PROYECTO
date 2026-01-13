import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";

export const EstadisticasAdopcion = () => {
  const stats = [
    { label: "Módulos Activos", value: "8+", sub: "En constante expansión" },
    { label: "Uptime Garantizado", value: "99.9%", sub: "SLA Empresarial" },
    { label: "Tiempo de Respuesta", value: "<15m", sub: "Soporte Prioritario" },
  ];

  return (
    <section className="w-full py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-manrope leading-tight">
              Impacto Real. <br />
              <span className="text-indigo-400">Datos Transparentes.</span>
            </h2>
            <p className="text-lg text-white/50 leading-relaxed font-light">
              Nuestra infraestructura está diseñada para escalar. No importa si procesas
              10 o 10,000 transacciones diarias, HoryCore se mantiene estable, rápido y seguro.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <GlassCard className="p-6 text-center !bg-[#0A0B10]/60">
              <span className="block text-4xl font-bold text-white mb-2 font-manrope">~45m</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Implementación</span>
            </GlassCard>
            <GlassCard className="p-6 text-center !bg-[#0A0B10]/60">
              <span className="block text-4xl font-bold text-white mb-2 font-manrope">+30%</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Productividad</span>
            </GlassCard>

            <div className="col-span-2 p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-center flex items-center justify-between px-10">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Roadmap 2026</span>
              <span className="text-white font-bold text-sm">Expansión Regional Global</span>
            </div>
          </div>
        </div>

        {/* Big Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-white/5">
          {stats.map((stat, i) => (
            <div key={i} className="text-center md:text-left group">
              <h3 className="text-6xl font-bold text-white mb-2 tracking-tighter group-hover:text-indigo-400 transition-colors duration-300">{stat.value}</h3>
              <p className="text-white font-bold text-lg mb-1">{stat.label}</p>
              <p className="text-white/30 text-xs uppercase tracking-wide">{stat.sub}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

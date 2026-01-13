import { motion } from 'framer-motion';
import { GlassCard } from "./ui/GlassCard";
import { Layers, TrendingDown, Clock, MoveRight } from "lucide-react";

export const PorQueElegir = () => {
  return (
    <section className="w-full py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-6 mb-16 w-full">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-manrope tracking-tight leading-none whitespace-nowrap">
            ¿Por Qué HoryCore?
          </h2>
          <div className="h-[1px] bg-white/10 w-full rounded-full relative overflow-hidden flex-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
          </div>
        </div>

        {/* Grid de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1: Módulos */}
          <GlassCard className="p-8 md:p-10 !bg-[#060a14]/60 hover:border-indigo-500/30 transition-all duration-300 group">
            <div className="mb-6 relative">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <Layers className="w-8 h-8" />
              </div>
              {/* Badge Absolute */}
              <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                +12
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-manrope">Módulos Integrados</h3>
            <p className="text-white/50 leading-relaxed font-light">
              Desde inventarios hasta contabilidad, todo conectado en un solo ecosistema.
            </p>
          </GlassCard>

          {/* Card 2: Costos */}
          <GlassCard className="p-8 md:p-10 !bg-[#060a14]/60 hover:border-green-500/30 transition-all duration-300 group">
            <div className="mb-6 relative">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="w-8 h-8" />
              </div>
              <div className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                -40%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-manrope">Reducción de Costos</h3>
            <p className="text-white/50 leading-relaxed font-light">
              Optimiza operaciones y elimina redundancias para maximizar tu rentabilidad.
            </p>
          </GlassCard>

          {/* Card 3: Soporte */}
          <GlassCard className="p-8 md:p-10 !bg-[#060a14]/60 hover:border-purple-500/30 transition-all duration-300 group">
            <div className="mb-6 relative">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8" />
              </div>
              <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                24/7
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-manrope">Soporte Local</h3>
            <p className="text-white/50 leading-relaxed font-light">
              Equipo técnico en Perú listo para resolver cualquier duda en minutos.
            </p>
          </GlassCard>

        </div>
      </div>
    </section>
  );
};

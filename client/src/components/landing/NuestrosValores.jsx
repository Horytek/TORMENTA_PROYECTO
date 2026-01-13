import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { Lightbulb, Heart, ShieldCheck, TrendingUp } from "lucide-react";

export const NuestrosValores = () => {
  const valores = [
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Innovación Constante",
      description: "Nos mantenemos a la vanguardia tecnológica, implementando las últimas tendencias en desarrollo."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Enfoque al Cliente",
      description: "Cada funcionalidad está diseñada pensando en las necesidades reales y la experiencia de uso."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Seguridad y Confianza",
      description: "Implementamos los más altos estándares de seguridad para proteger tu información empresarial."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Crecimiento Sostenible",
      description: "Soluciones escalables que crecen junto con tu empresa, adaptándose a nuevos desafíos."
    }
  ];

  return (
    <section className="w-full py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">

        <div className="mb-16">
          <span className="text-indigo-400 font-bold tracking-widest text-xs uppercase mb-2 block">Nuestra Cultura</span>
          <h2 className="text-4xl font-bold text-white font-manrope">Nuestros Valores</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {valores.map((valor, index) => (
            <GlassCard
              key={index}
              className="p-8 md:p-10 flex items-start gap-6 hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-all duration-300">
                {valor.icon}
              </div>

              <div>
                <h4 className="text-xl font-bold text-white mb-3 font-manrope">{valor.title}</h4>
                <p className="text-white/50 leading-relaxed font-light">
                  {valor.description}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

      </div>
    </section>
  );
};

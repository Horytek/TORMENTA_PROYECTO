import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { Target, Shield, Zap } from "lucide-react";

export const NuestraEmpresa = () => {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">

          {/* Narrative Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-manrope leading-tight">
                Democratizando la <br />
                <span className="text-indigo-400">tecnología empresarial</span>
              </h2>
              <div className="w-20 h-1 bg-indigo-500 rounded-full" />
            </div>

            <div className="space-y-6 text-lg text-white/60 leading-relaxed font-light">
              <p>
                En Horycore, creemos que las herramientas de gestión de alto nivel no deberían ser exclusivas de las grandes corporaciones. Nacimos con la visión de nivelar el terreno de juego.
              </p>
              <p>
                Diseñamos un ecosistema donde la contabilidad, las ventas y la logística conversan entre sí en tiempo real, eliminando silos y permitiendo que los dueños de negocios tomen decisiones basadas en datos, no en intuiciones.
              </p>
            </div>
          </motion.div>

          {/* Mission Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <GlassCard className="p-10 md:p-12 relative overflow-hidden group !bg-white/[0.03]">

              {/* Decorative Quote */}
              <div className="absolute top-4 right-8 text-white/[0.03] text-9xl font-serif font-bold pointer-events-none select-none">
                "
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <Target className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-manrope">Nuestra Misión</h3>
                </div>

                <p className="text-2xl md:text-3xl text-white/90 font-light italic leading-relaxed mb-8">
                  "Empoderar a las empresas peruanas con software de clase mundial, eliminando las barreras de la complejidad digital."
                </p>

                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                    HC
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">El Equipo HoryCore</p>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Lima, Perú</p>
                  </div>
                </div>
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </GlassCard>
          </motion.div>

        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Target className="w-6 h-6" />, title: "Control Total", desc: "Información centralizada en una sola fuente de verdad." },
            { icon: <Shield className="w-6 h-6" />, title: "Seguridad Bancaria", desc: "Tus datos protegidos con los más altos estándares." },
            { icon: <Zap className="w-6 h-6" />, title: "Evolución Constante", desc: "Actualizaciones automáticas sin costos ocultos." }
          ].map((item, i) => (
            <GlassCard key={i} className="p-8 md:p-10 hover:bg-white/[0.05] transition-colors group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6 border border-white/10 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-all duration-300">
                {item.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3 font-manrope">{item.title}</h4>
              <p className="text-white/50 leading-relaxed font-light">{item.desc}</p>
            </GlassCard>
          ))}
        </div>

      </div>
    </section>
  );
};

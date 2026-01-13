import { motion } from 'framer-motion';

export const EstadisticasAdopcion = () => {
  const items = [
    { label: "Módulos Activos", value: "8+", sub: "En constante expansión" },
    { label: "Uptime Garantizado", value: "99.9%", sub: "SLA Empresarial" },
    { label: "Tiempo de Respuesta", value: "<15m", sub: "Soporte Prioritario" },
  ];

  return (
    <section className="w-full py-24 bg-transparent border-t border-white/5">
      <div className="flex justify-center px-4">
        <div className="w-full xl:w-[1280px]">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-bold text-white mb-6"
              >
                Impacto Real. <br />
                <span className="text-white/40">Datos Transparentes.</span>
              </motion.h2>
              <p className="text-lg text-secondary-text leading-relaxed">
                Nuestra infraestructura está diseñada para escalar. No importa si procesas
                10 o 10,000 transacciones diarias, HoryCore se mantiene estable, rápido y seguro.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                <span className="block text-4xl font-bold text-white mb-2">~45m</span>
                <span className="text-xs uppercase tracking-widest text-secondary-text">Implementación</span>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                <span className="block text-4xl font-bold text-white mb-2">+30%</span>
                <span className="text-xs uppercase tracking-widest text-secondary-text">Productividad</span>
              </div>
              <div className="col-span-2 p-6 bg-gradient-to-r from-secondary-color/20 to-secondary-color/5 rounded-2xl border border-secondary-color/20 text-center flex items-center justify-between px-10">
                <span className="text-sm text-secondary-color font-bold uppercase">Roadmap 2026</span>
                <span className="text-white font-bold">Expansión Regional</span>
              </div>
            </div>
          </div>

          {/* Big Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/10 pt-16">
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center md:text-left"
              >
                <h3 className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-2">{item.value}</h3>
                <p className="text-white font-bold text-lg">{item.label}</p>
                <p className="text-white/40 text-sm">{item.sub}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

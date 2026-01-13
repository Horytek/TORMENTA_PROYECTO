import { motion } from "framer-motion";

export const BeneficiosClave = ({ onOpenModal }) => {
  const beneficios = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      ),
      titulo: "Integración Total",
      descripcion: "Finanzas, Ventas y Logística en una sola fuente de verdad.",
      chip: "100% UNIFICADO"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      ),
      titulo: "Cumplimiento SUNAT",
      descripcion: "Facturación electrónica y libros PLE actualizados.",
      chip: "NORMATIVA"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      titulo: "Escalabilidad",
      descripcion: "Crece sin límites de usuarios o transacciones.",
      chip: "ILIMITADO",
      highlight: true
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      ),
      titulo: "Cloud Native",
      descripcion: "Acceso seguro desde cualquier lugar, 24/7.",
      chip: "ONLINE"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 5.472m0 0a9.09 9.09 0 00-3.279 3.298m.091-7.663c.21.11.43.21.66.295.6.22 1.25.337 1.91.337a6.002 6.002 0 003.76-1.597m0 0A9.01 9.01 0 0112 8.25c2.485 0 4.734.996 6.406 2.623m0 0a5.992 5.992 0 013.76 1.597m0 0c.23-.085.45-.185.66-.295a9.096 9.096 0 013.185-3.142" />
        </svg>
      ),
      titulo: "Soporte Local",
      descripcion: "Equipo técnico especializado en Perú.",
      chip: "<2 HORAS"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      ),
      titulo: "Personalizable",
      descripcion: "Adaptable a flujos específicos de tu industria.",
      chip: "MODULAR"
    }
  ];

  return (
    <section className="w-full py-24 relative" id="beneficios">
      <div className="flex justify-center px-4">
        <div className="w-full xl:w-[1280px]">

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-16"
          >
            <h2 className="text-3xl font-bold text-white">Beneficios Clave</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
          </motion.div>

          {/* Grid de beneficios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`group relative p-8 rounded-2xl transition-all duration-500 overflow-hidden ${beneficio.highlight
                    ? "bg-white/10 border border-secondary-color/30 shadow-2xl shadow-secondary-color/10"
                    : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
              >
                {/* Corner Chip */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${beneficio.highlight
                      ? "text-secondary-color border-secondary-color/30 bg-secondary-color/10"
                      : "text-white/40 border-white/5 bg-white/5"
                    }`}>
                    {beneficio.chip}
                  </span>
                </div>

                <div className="flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-2xl transition-transform duration-300 group-hover:scale-110 ${beneficio.highlight
                      ? "bg-secondary-color/20 text-secondary-color border border-secondary-color/20"
                      : "bg-white/10 text-white border border-white/10"
                    }`}>
                    {beneficio.icon}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">
                    {beneficio.titulo}
                  </h3>

                  <p className="text-secondary-text text-sm leading-relaxed">
                    {beneficio.descripcion}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

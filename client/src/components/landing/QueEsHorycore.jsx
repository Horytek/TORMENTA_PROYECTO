import { motion } from 'framer-motion';
import { GlassCard } from "./ui/GlassCard";
import { Layers, Box, BarChart3, Users } from "lucide-react";

export const QueEsHorycore = () => {
  return (
    <section className="w-full py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-manrope">
              ¿Qué es <span className="text-indigo-400">Horycore ERP</span>?
            </h2>
            <p className="text-lg text-white/60 leading-relaxed font-light">
              Es el sistema operativo central de tu negocio. Una plataforma unificada diseñada para simplificar la gestión dia a día y darte el control total que necesitas para escalar.
            </p>
          </motion.div>
        </div>

        {/* Feature Grid (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Layers className="w-6 h-6" />,
              title: "Ventas y Finanzas",
              desc: "Administra proveedores, clientes y libros de ventas en un solo flujo."
            },
            {
              icon: <Box className="w-6 h-6" />,
              title: "Inventario Kardex",
              desc: "Control total de productos, almacenes y movimiento entre sucursales."
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: "Analítica Real",
              desc: "Reportes detallados para tomar decisiones basadas en datos, no en intuición."
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: "Gestión de Equipos",
              desc: "Roles, permisos y auditoría de acciones para cada colaborador."
            }
          ].map((item, i) => (
            <GlassCard key={i} className="p-8 hover:-translate-y-1 hover:bg-white/[0.04] transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-manrope">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed font-light">{item.desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Closing Statement */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center max-w-2xl mx-auto"
        >
          <div className="inline-block p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
            <p className="text-white/70 italic">
              "Estamos trabajando constantemente para añadir más funcionalidades y potenciar tu negocio."
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

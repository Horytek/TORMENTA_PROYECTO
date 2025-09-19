import { motion } from "framer-motion";

export const ServiciosAdicionales = () => {
  const servicios = [
    {
      icon: "🔧",
      titulo: "Implementación y Capacitación",
      descripcion: "Acompañamiento completo desde la instalación hasta la adopción total del sistema por parte de tu equipo.",
      color: "from-primary-color to-secondary-color",
      destacados: ["Migración de datos", "Capacitación personalizada", "Go-live asegurado"],
      tiempo: "2-4 semanas"
    },
    {
      icon: "🔗",
      titulo: "Integraciones",
      descripcion: "Conectamos HoryCore con tus sistemas existentes: bancos, e-commerce, POS, y más.",
      color: "from-secondary-color to-primary-color",
      destacados: ["APIs robustas", "Sincronización en tiempo real", "Compatibilidad total"],
      tiempo: "1-2 semanas"
    },
    {
      icon: "☁️",
      titulo: "Hosting en la Nube",
      descripcion: "Infraestructura segura y confiable con respaldos automáticos y alta disponibilidad.",
      color: "from-primary-color to-secondary-color",
      destacados: ["99.9% uptime", "Backups automáticos", "Seguridad avanzada"],
      tiempo: "Disponible 24/7"
    },
    {
      icon: "🛠️",
      titulo: "Soporte Técnico 24/7",
      descripcion: "Asistencia técnica continua para garantizar el funcionamiento óptimo de tu sistema.",
      color: "from-secondary-color to-primary-color",
      destacados: ["Respuesta inmediata", "Expertos locales", "Múltiples canales"],
      tiempo: "Siempre disponible"
    }
  ];

  return (
    <section className="w-full py-20 bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1" id="servicios-adicionales">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
          {/* Header de la sección */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Servicios Adicionales</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6 max-w-32"></div>
          </div>
          
          <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 max-w-4xl mx-auto">
            <p className="text-lg leading-relaxed text-secondary-text">
              Complementamos tu inversión con <span className="text-secondary-color font-semibold">servicios especializados</span> que aseguran el <span className="text-white font-medium">éxito de tu implementación</span>.
            </p>
          </div>
        </motion.div>

        {/* Grid de servicios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {servicios.map((servicio, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden"
            >
              {/* Elementos decorativos de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/10 to-transparent rounded-full blur-3xl"></div>
              
              {/* Contenido principal */}
              <div className="relative z-10">
                <div className="flex items-start mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-2xl border border-secondary-color/30 flex items-center justify-center mr-6 flex-shrink-0 text-3xl group-hover:scale-105 transition-transform duration-300">
                    {servicio.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-secondary-color transition-colors duration-300 mb-2">
                      {servicio.titulo}
                    </h3>
                    <p className="text-secondary-text transition-colors duration-300 mb-3">
                      {servicio.descripcion}
                    </p>
                    <div className="inline-flex items-center bg-primary-color/10 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-primary-color rounded-full mr-2"></div>
                      <span className="text-primary-color text-xs font-medium">{servicio.tiempo}</span>
                    </div>
                  </div>
                </div>

                <div className="w-24 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-6 rounded-full"></div>

                <div className="space-y-3">
                  {servicio.destacados.map((destacado, idx) => (
                    <div key={idx} className="flex items-center group/item">
                      <div className="w-2 h-2 bg-secondary-color rounded-full mr-3 group-hover/item:bg-primary-color transition-colors duration-200"></div>
                      <span className="text-secondary-text text-sm group-hover/item:text-white transition-colors duration-200">{destacado}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sectores que Atendemos - Rediseñado */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-2 h-8 bg-gradient-to-b from-primary-color to-secondary-color rounded-full mr-4"></div>
              <h3 className="text-3xl font-bold text-white">Sectores que Atendemos</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-primary-color/30 to-transparent ml-6 max-w-32"></div>
            </div>
            
            <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-primary-color/50 max-w-4xl mx-auto">
              <p className="text-lg leading-relaxed text-secondary-text">
                Experiencia comprobada en <span className="text-primary-color font-semibold">múltiples industrias</span> con <span className="text-white font-medium">soluciones especializadas</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { nombre: "Manufactura", icon: "🏭", color: "border-primary-color/40" },
              { nombre: "Distribución", icon: "🚚", color: "border-secondary-color/40" },
              { nombre: "Retail", icon: "🛍️", color: "border-primary-color/40" },
              { nombre: "Servicios", icon: "🔧", color: "border-secondary-color/40" },
              { nombre: "Construcción", icon: "🏗️", color: "border-primary-color/40" },
              { nombre: "Farmacia", icon: "💊", color: "border-secondary-color/40" },
              { nombre: "Restaurantes", icon: "🍽️", color: "border-primary-color/40" },
              { nombre: "Importación", icon: "📦", color: "border-secondary-color/40" }
            ].map((sector, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: idx * 0.05,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                className={`group bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 rounded-xl border ${sector.color} hover:border-secondary-color/60 transition-all duration-300 text-center hover:shadow-lg hover:shadow-secondary-color/20`}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {sector.icon}
                </div>
                <span className="text-white font-medium group-hover:text-secondary-color transition-colors duration-300">
                  {sector.nombre}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to action para servicios */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden max-w-3xl mx-auto">
            {/* Elementos decorativos sutiles */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white group-hover:text-secondary-color transition-colors duration-300 mb-4">¿Listo para transformar tu empresa?</h3>
              <div className="w-24 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-6 rounded-full mx-auto"></div>
              <p className="text-secondary-text mb-6 text-lg">
                Nuestro equipo de expertos está listo para diseñar una solución a medida para tu negocio
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-gradient-to-r from-secondary-color to-primary-color text-white px-8 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-secondary-color/30 transition-all duration-300">
                  Solicitar cotización
                </button>
                <button className="border border-secondary-color/40 text-secondary-color px-8 py-3 rounded-full font-medium hover:bg-secondary-color/10 transition-all duration-300">
                  Ver demostración
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
};

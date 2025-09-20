import { motion } from "framer-motion";

export const ServiciosAdicionales = () => {
  const servicios = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.98C19.47,12.66 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.02L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.65 15.48,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.52,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.02C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.52,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.48,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.98Z"/>
        </svg>
      ),
      titulo: "Implementación y Capacitación",
      descripcion: "Acompañamiento completo desde la instalación hasta la adopción total del sistema por parte de tu equipo.",
      color: "from-primary-color to-secondary-color",
      destacados: ["Migración de datos", "Capacitación personalizada", "Go-live asegurado"],
      tiempo: "2-4 semanas"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.99C4.26 7 2 9.26 2 12s2.26 5 4.99 5H11v-1.9H6.99c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.01c2.73 0 4.99 2.26 4.99 5s-2.26 5-4.99 5H13v1.9h4.01C19.74 17 22 14.74 22 12s-2.26-5-4.99-5H13v1.9z"/>
        </svg>
      ),
      titulo: "Integraciones",
      descripcion: "Conectamos HoryCore con tus sistemas existentes: bancos, e-commerce, POS, y más.",
      color: "from-secondary-color to-primary-color",
      destacados: ["APIs robustas", "Sincronización en tiempo real", "Compatibilidad total"],
      tiempo: "1-2 semanas"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M19.35,10.04C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.04C2.34,8.36 0,10.91 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.04Z"/>
        </svg>
      ),
      titulo: "Hosting en la Nube",
      descripcion: "Infraestructura segura y confiable con respaldos automáticos y alta disponibilidad.",
      color: "from-primary-color to-secondary-color",
      destacados: ["99.9% uptime", "Backups automáticos", "Seguridad avanzada"],
      tiempo: "Disponible 24/7"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M19 8L15 12H18A6 6 0 1 1 6 12A6 6 0 0 1 12 6V9L16 5L12 1V4A8 8 0 1 0 20 12H17L19 8Z"/>
        </svg>
      ),
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
              { 
                nombre: "Manufactura", 
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto">
                    <path d="M7,2V4H8V18A4,4 0 0,0 12,22A4,4 0 0,0 16,18V4H17V2H7M11,16C10.4,16 10,15.6 10,15C10,14.4 10.4,14 11,14C11.6,14 12,14.4 12,15C12,15.6 11.6,16 11,16M13,12C12.4,12 12,11.6 12,11C12,10.4 12.4,10 13,10C13.6,10 14,10.4 14,11C14,11.6 13.6,12 13,12M14,7H10V4H14V7Z"/>
                  </svg>
                ),
                color: "border-primary-color/40" 
              },
              { 
                nombre: "Distribución", 
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto">
                    <path d="M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5M19.5,9.5L21.46,6H15L13.5,9.5M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M20,8H17V4H3C1.89,4 1,4.89 1,6V15H3A3,3 0 0,0 6,18A3,3 0 0,0 9,15H15A3,3 0 0,0 18,18A3,3 0 0,0 21,15H23V12L20,8Z"/>
                  </svg>
                ),
                color: "border-secondary-color/40" 
              },
              { 
                nombre: "Retail", 
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto">
                    <path d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,3H1M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z"/>
                  </svg>
                ),
                color: "border-primary-color/40" 
              },
              { 
                nombre: "Servicios", 
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.98C19.47,12.66 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.02L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.65 15.48,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.52,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.02C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.52,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.48,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.98Z"/>
                  </svg>
                ),
                color: "border-secondary-color/40" 
              },
              { 
                nombre: "Construcción", 
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto">
                    <path d="M12,2L2,22H22L12,2M12,6L19.5,20H4.5L12,6Z"/>
                  </svg>
                ),
                color: "border-primary-color/40" 
              },
              { 
                nombre: "Farmacia", 
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto">
                    <path d="M17,3A1,1 0 0,1 18,4V7A1,1 0 0,1 17,8H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21V8H7A1,1 0 0,1 6,7V4A1,1 0 0,1 7,3H17M11,9H13V11H15V13H13V15H11V13H9V11H11V9Z"/>
                  </svg>
                ),
                color: "border-secondary-color/40" 
              },
              { 
                nombre: "Restaurantes", 
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto">
                    <path d="M8.1,13.34L3.91,9.16C2.35,7.59 2.35,5.06 3.91,3.5L10.93,10.5L8.1,13.34M14.88,11.53C16.77,12.4 18.24,13.91 19.07,15.81L15,19.88L9.41,14.29L14.88,11.53M13.1,6.66C13.1,5.04 14.39,3.75 16,3.75C17.61,3.75 18.9,5.04 18.9,6.66C18.9,8.27 17.61,9.56 16,9.56C14.39,9.56 13.1,8.27 13.1,6.66Z"/>
                  </svg>
                ),
                color: "border-primary-color/40" 
              },
              { 
                nombre: "Importación", 
                icon: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
                  </svg>
                ),
                color: "border-secondary-color/40" 
              }
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
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
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

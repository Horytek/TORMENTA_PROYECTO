import { motion } from "framer-motion";

export const BeneficiosClave = () => {
  const beneficios = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.99C4.26 7 2 9.26 2 12s2.26 5 4.99 5H11v-1.9H6.99c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.01c2.73 0 4.99 2.26 4.99 5s-2.26 5-4.99 5H13v1.9h4.01C19.74 17 22 14.74 22 12s-2.26-5-4.99-5H13v1.9z"/>
        </svg>
      ),
      titulo: "Integración Total",
      descripcion: "Todos los módulos trabajan de forma sincronizada para una gestión unificada",
      color: "from-primary-color to-secondary-color",
      stat: "100%"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 2L13.09 8.26L18 7L16.74 12L22 14.14L15.74 17.26L17 22L12 20.74L7 22L8.26 17.26L2 14.14L7.26 12L6 7L10.91 8.26L12 2Z"/>
        </svg>
      ),
      titulo: "Cumplimiento Legal",
      descripcion: "100% compatible con normativas peruanas (SUNAT, PLAME, etc.)",
      color: "from-secondary-color to-primary-color",
      stat: "Certificado"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
        </svg>
      ),
      titulo: "Escalabilidad",
      descripcion: "Crece junto con tu empresa sin límites de usuarios o funcionalidades",
      color: "from-primary-color to-secondary-color",
      stat: "Ilimitado"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,19V17H9A6,6 0 0,1 3,11H5C5,13.78 7.22,16 10,16H11V14L15,17L11,20V19Z"/>
        </svg>
      ),
      titulo: "Acceso Remoto",
      descripcion: "Disponible desde cualquier dispositivo con internet, trabajo híbrido",
      color: "from-secondary-color to-primary-color",
      stat: "24/7"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"/>
        </svg>
      ),
      titulo: "Soporte Local",
      descripcion: "Equipo técnico especializado en Perú con respuesta inmediata",
      color: "from-primary-color to-secondary-color",
      stat: "<2hrs"
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.98C19.47,12.66 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.02L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.65 15.48,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.52,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.02C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.52,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.48,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.98Z"/>
        </svg>
      ),
      titulo: "Personalización",
      descripcion: "Adaptable a las necesidades específicas de tu industria y procesos",
      color: "from-secondary-color to-primary-color",
      stat: "100%"
    }
  ];

  return (
    <section className="w-full py-20 bg-gradient-to-br from-bgDark2 via-bgDark1 to-bgDark2" id="beneficios">
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
            <h2 className="text-3xl md:text-4xl font-bold text-white">Beneficios Clave</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6 max-w-32"></div>
          </div>
          
          <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 max-w-4xl mx-auto">
            <p className="text-lg leading-relaxed text-secondary-text">
              Descubre por qué más de <span className="text-secondary-color font-semibold">500+ empresas confían en HoryCore</span> para transformar su <span className="text-white font-medium">gestión empresarial</span>.
            </p>
          </div>
        </motion.div>

        {/* Grid de beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {beneficios.map((beneficio, index) => (
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
              className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden"
            >
              {/* Elementos decorativos de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-secondary-color/20 to-transparent rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl border border-secondary-color/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300">
                    {beneficio.icon}
                  </div>
                  <div className="bg-secondary-color/10 px-3 py-1 rounded-full">
                    <span className="text-secondary-color text-xs font-bold">{beneficio.stat}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white group-hover:text-secondary-color transition-colors duration-300 mb-3">
                  {beneficio.titulo}
                </h3>
                
                <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-4 rounded-full"></div>
                
                <p className="text-secondary-text group-hover:text-white transition-colors duration-300 text-sm leading-relaxed">
                  {beneficio.descripcion}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden max-w-4xl mx-auto">
            {/* Elementos decorativos sutiles */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center bg-secondary-color/10 px-4 py-2 rounded-full text-secondary-color text-sm mb-6 border border-secondary-color/30">
                <span className="w-2 h-2 bg-secondary-color rounded-full mr-2 animate-pulse"></span>
                Transformación empresarial garantizada
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-secondary-color transition-colors duration-300 mb-4">
                Optimiza tu empresa con <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-color to-primary-color">tecnología de vanguardia</span>
              </h3>
              <div className="w-24 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-6 rounded-full mx-auto"></div>
              <p className="text-lg text-secondary-text mb-8">
                Únete a las empresas líderes que ya transformaron su gestión con HoryCore ERP
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-gradient-to-r from-secondary-color to-primary-color text-white px-8 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-secondary-color/30 transition-all duration-300">
                  Solicitar Demo Gratuita
                </button>
                <button className="border border-secondary-color/40 text-secondary-color px-8 py-3 rounded-full font-medium hover:bg-secondary-color/10 transition-all duration-300">
                  Ver Casos de Éxito
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

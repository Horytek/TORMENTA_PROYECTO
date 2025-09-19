import { motion } from "framer-motion";

export const BeneficiosClave = () => {
  const beneficios = [
    {
      icon: "🔗",
      titulo: "Integración Total",
      descripcion: "Todos los módulos trabajan de forma sincronizada para una gestión unificada",
      color: "from-primary-color to-secondary-color",
      stat: "100%"
    },
    {
      icon: "⚖️",
      titulo: "Cumplimiento Legal",
      descripcion: "100% compatible con normativas peruanas (SUNAT, PLAME, etc.)",
      color: "from-secondary-color to-primary-color",
      stat: "Certificado"
    },
    {
      icon: "📈",
      titulo: "Escalabilidad",
      descripcion: "Crece junto con tu empresa sin límites de usuarios o funcionalidades",
      color: "from-primary-color to-secondary-color",
      stat: "Ilimitado"
    },
    {
      icon: "🌐",
      titulo: "Acceso Remoto",
      descripcion: "Disponible desde cualquier dispositivo con internet, trabajo híbrido",
      color: "from-secondary-color to-primary-color",
      stat: "24/7"
    },
    {
      icon: "🇵🇪",
      titulo: "Soporte Local",
      descripcion: "Equipo técnico especializado en Perú con respuesta inmediata",
      color: "from-primary-color to-secondary-color",
      stat: "<2hrs"
    },
    {
      icon: "⚙️",
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

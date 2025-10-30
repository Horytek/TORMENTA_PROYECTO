import { motion } from 'framer-motion';

export const ProximasActualizaciones = () => {
  return (
    <section className="w-full py-16 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center mb-8"
          >
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-white">Próximas Actualizaciones</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
          </motion.div>
          
          {/* Próxima versión */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-3xl border border-gray-600/30 hover:border-primary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-color/10"
          >
            {/* Elemento decorativo */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-color/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-color/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-2xl border border-primary-color/30 flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1 transition-colors duration-300">Versión 4.3.0</h3>
                  <p className="text-secondary-color font-semibold">Octubre 2025</p>
                </div>
              </div>
              <span className="bg-gradient-to-r from-secondary-color to-primary-color text-white px-4 py-1 rounded-full text-xs font-bold inline-block w-fit">PRÓXIMAMENTE</span>
            </div>
            
            <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6">
              <p className="text-lg leading-relaxed text-secondary-text">
                Estamos desarrollando una versión revolucionaria con <span className="text-primary-color font-semibold">Reportes Generados por IA</span> para transformar la forma en que visualizas y analizas tus datos empresariales.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-1.5 h-6 bg-gradient-to-b from-primary-color to-secondary-color rounded-full mr-3"></div>
                <h4 className="text-xl font-semibold text-white">Funcionalidades Planificadas</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-bgDark2/50 p-4 rounded-xl border border-primary-color/20 hover:border-primary-color/40 transition-colors duration-300">
                  <h5 className="text-lg font-semibold text-white mb-2">Reportes con IA</h5>
                  <p className="text-secondary-text text-sm">Solicita cualquier reporte escribiendo en lenguaje natural. La IA comprenderá tu solicitud y generará automáticamente el reporte personalizado que necesitas.</p>
                </div>
                
                <div className="bg-bgDark2/50 p-4 rounded-xl border border-secondary-color/20 hover:border-secondary-color/40 transition-colors duration-300">
                  <h5 className="text-lg font-semibold text-white mb-2">Análisis Inteligente</h5>
                  <p className="text-secondary-text text-sm">La IA analizará tus datos y te sugerirá insights relevantes, tendencias y recomendaciones automáticamente.</p>
                </div>
                
                <div className="bg-bgDark2/50 p-4 rounded-xl border border-primary-color/20 hover:border-primary-color/40 transition-colors duration-300">
                  <h5 className="text-lg font-semibold text-white mb-2">Visualización Dinámica</h5>
                  <p className="text-secondary-text text-sm">Gráficos y tablas generados automáticamente según tu solicitud, con opciones de personalización inteligentes.</p>
                </div>
                
                <div className="bg-bgDark2/50 p-4 rounded-xl border border-secondary-color/20 hover:border-secondary-color/40 transition-colors duration-300">
                  <h5 className="text-lg font-semibold text-white mb-2">Exportación Flexible</h5>
                  <p className="text-secondary-text text-sm">Exporta tus reportes en múltiples formatos (PDF, Excel, PowerPoint) con formato profesional automático.</p>
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

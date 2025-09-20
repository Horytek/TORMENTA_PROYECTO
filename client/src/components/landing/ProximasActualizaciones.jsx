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
                Estamos desarrollando una versión revolucionaria con <span className="text-primary-color font-semibold">IA conversacional</span> y <span className="text-white font-medium">tecnologías blockchain</span> para transformar tu experiencia.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-1.5 h-6 bg-gradient-to-b from-primary-color to-secondary-color rounded-full mr-3"></div>
                <h4 className="text-xl font-semibold text-white">Funcionalidades Planificadas</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-bgDark2/50 p-4 rounded-xl border border-primary-color/20 hover:border-primary-color/40 transition-colors duration-300">
                  <h5 className="text-lg font-semibold text-white mb-2">IA Conversacional</h5>
                  <p className="text-secondary-text text-sm">Asistente virtual inteligente para consultas y soporte en tiempo real con capacidad para entender el contexto de tu negocio.</p>
                </div>
                
                <div className="bg-bgDark2/50 p-4 rounded-xl border border-secondary-color/20 hover:border-secondary-color/40 transition-colors duration-300">
                  <h5 className="text-lg font-semibold text-white mb-2">Blockchain</h5>
                  <p className="text-secondary-text text-sm">Trazabilidad inmutable de productos y transacciones con certificación digital para mayor transparencia.</p>
                </div>
                
                <div className="bg-bgDark2/50 p-4 rounded-xl border border-primary-color/20 hover:border-primary-color/40 transition-colors duration-300">
                  <h5 className="text-lg font-semibold text-white mb-2">IoT Integration</h5>
                  <p className="text-secondary-text text-sm">Conexión con sensores y dispositivos inteligentes para monitoreo en tiempo real de inventarios y equipos.</p>
                </div>
                
                <div className="bg-bgDark2/50 p-4 rounded-xl border border-secondary-color/20 hover:border-secondary-color/40 transition-colors duration-300">
                  <h5 className="text-lg font-semibold text-white mb-2">Marketplace</h5>
                  <p className="text-secondary-text text-sm">Plataforma de extensiones y complementos desarrollados por terceros para personalizar tu experiencia.</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary-color/20 to-primary-color/20 blur-lg rounded-2xl"></div>
              <div className="relative bg-bgDark2 p-6 rounded-xl border border-secondary-color/30">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-white">¿Quieres probar las nuevas funciones?</h5>
                    <p className="text-secondary-text text-sm">Únete al programa beta y sé el primero en experimentar la innovación</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button className="px-4 py-2 bg-gradient-to-r from-secondary-color to-primary-color text-white rounded-lg text-sm font-medium hover:from-secondary-color/90 hover:to-primary-color/90 transition-colors duration-300">
                    Unirse al Programa Beta
                  </button>
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

import { motion } from 'framer-motion';

export const EstadisticasAdopcion = () => {
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
            <h2 className="text-3xl font-bold text-white">Estadísticas de Adopción</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-8"
          >
            <p className="text-lg leading-relaxed text-secondary-text">
              Conoce el <span className="text-secondary-color font-semibold">impacto y alcance</span> de HoryCore en el mercado empresarial peruano y el <span className="text-white font-medium">nivel de satisfacción</span> de nuestros usuarios.
            </p>
          </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {/* Card 1 */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 rounded-2xl border border-gray-600/20 hover:border-secondary-color/50 transition-all duration-300 overflow-hidden">
            {/* Elemento decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-color/10 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-2xl border border-secondary-color/30 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">+5</span>
              </div>
              
              <p className="text-lg text-secondary-color font-medium mt-1">Módulos Implementados</p>
              <p className="text-sm text-secondary-text mt-2">Amplia variedad de módulos y funcionalidades desarrolladas para optimizar tu gestión empresarial.</p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 rounded-2xl border-2 border-primary-color/40 transition-all duration-300 overflow-hidden shadow-lg shadow-primary-color/10">
            {/* Elemento decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-color/10 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-color/30 to-primary-color/10 rounded-2xl border border-primary-color/40 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </div>
              
              <p className="text-2xl font-bold text-primary-color mt-4 mb-2">Tecnología en evolución</p>
              <p className="text-sm text-secondary-text mt-2">Estamos construyendo el futuro de la gestión empresarial con herramientas inteligentes para negocios del Perú.</p>
            </div>
          </div>
          
          {/* Card 3 */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 rounded-2xl border border-gray-600/20 hover:border-secondary-color/50 transition-all duration-300 overflow-hidden">
            {/* Elemento decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-color/10 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-2xl border border-secondary-color/30 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">99.9</span>
                <span className="text-2xl font-bold text-secondary-color ml-1">%</span>
              </div>
              
              <p className="text-lg text-secondary-color font-medium mt-1">Tiempo de Actividad</p>
              <p className="text-sm text-secondary-text mt-2">Garantizamos disponibilidad permanente con servidores redundantes y sistemas de respaldo automático.</p>
            </div>
          </div>
        </motion.div>
        
        {/* Indicadores adicionales */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
        >
          <div className="bg-bgDark2/70 p-4 rounded-xl border border-gray-600/30">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-white">45</span>
              <span className="text-sm font-medium text-secondary-color ml-1">min</span>
            </div>
            <p className="text-xs text-secondary-text mt-1">Tiempo promedio de implementación</p>
          </div>
          
          <div className="bg-bgDark2/70 p-4 rounded-xl border border-gray-600/30">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-white">32</span>
              <span className="text-sm font-medium text-secondary-color ml-1">%</span>
            </div>
            <p className="text-xs text-secondary-text mt-1">Aumento en productividad</p>
          </div>
          
          <div className="bg-bgDark2/70 p-4 rounded-xl border border-gray-600/30">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-white">12</span>
              <span className="text-sm font-medium text-secondary-color ml-1">min</span>
            </div>
            <p className="text-xs text-secondary-text mt-1">Respuesta soporte técnico</p>
          </div>
          
          <div className="bg-bgDark2/70 p-4 rounded-xl border border-gray-600/30">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-white">28</span>
              <span className="text-sm font-medium text-secondary-color ml-1">días</span>
            </div>
            <p className="text-xs text-secondary-text mt-1">Ciclo de desarrollo</p>
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
};

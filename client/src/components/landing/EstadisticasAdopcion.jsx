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
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">98.5</span>
                <span className="text-2xl font-bold text-secondary-color ml-1">%</span>
              </div>
              
              <p className="text-lg text-secondary-color font-medium mt-1">Satisfacción del Cliente</p>
              <p className="text-sm text-secondary-text mt-2">Basado en encuestas trimestrales a más de 5,000 usuarios activos del sistema.</p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 rounded-2xl border-2 border-primary-color/40 transition-all duration-300 overflow-hidden shadow-lg shadow-primary-color/10">
            {/* Elemento decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-color/10 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-color/30 to-primary-color/10 rounded-2xl border border-primary-color/40 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">7,500</span>
                <span className="text-2xl font-bold text-primary-color ml-1">+</span>
              </div>
              
              <p className="text-lg text-primary-color font-medium mt-1">Empresas Activas</p>
              <p className="text-sm text-secondary-text mt-2">Negocios que confían en HoryCore para su gestión diaria en todo el Perú.</p>
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

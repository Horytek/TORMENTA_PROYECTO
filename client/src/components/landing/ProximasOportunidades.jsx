import { motion } from 'framer-motion';

export const ProximasOportunidades = ({ onOpenModal }) => {
  return (
    <section className="w-full py-24 bg-gradient-to-b from-bgDark2 to-bgDark1">
      <div className="max-w-6xl mx-auto px-8">
        {/* Título */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex items-center mb-6"
        >
          <div className="w-2 h-8 bg-gradient-to-b from-primary-color to-secondary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">Próximas Oportunidades</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-primary-color/30 to-transparent ml-6"></div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-bgDark2/60 to-bgDark1/30 p-8 rounded-2xl border border-gray-600/30 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-2xl border border-secondary-color/40 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">¡Estamos Creciendo!</h3>
          <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50">
            <p className="text-lg leading-relaxed text-secondary-text">
              A medida que <span className="text-secondary-color font-semibold">Horycore continúa expandiéndose</span>, estaremos añadiendo más posiciones en diferentes áreas como desarrollo, marketing, soporte técnico y gestión de proyectos. 
            </p>
          </div>
          
          <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mt-4">
            <p className="text-lg leading-relaxed text-secondary-text">
              Si estás interesado en formar parte de nuestro equipo pero no encuentras una posición que se ajuste a tu perfil, <span className="text-white font-medium">¡contáctanos!</span> Siempre estamos buscando talento excepcional para unirse a nuestra misión.
            </p>
          </div>

          <div className="mt-8">
            <p className="text-secondary-color font-semibold mb-4">¿Quieres ser notificado sobre nuevas oportunidades?</p>
            <button 
              onClick={onOpenModal}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-color/20 to-secondary-color/20 text-white font-semibold rounded-xl border border-secondary-color/30 hover:bg-gradient-to-r hover:from-primary-color/30 hover:to-secondary-color/30 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              Alertas de Empleo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
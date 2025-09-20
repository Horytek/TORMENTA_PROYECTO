import { motion } from 'framer-motion';

export const TransformacionDigital = () => {
  return (
    <section className="w-full py-12 bg-gradient-to-b from-bgDark1 to-bgDark2">
      <div className="max-w-6xl mx-auto px-8">
        {/* Título */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex items-center mb-6"
        >
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">Únete a la Transformación Digital</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </motion.div>
        
        {/* Descripción en cards */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6"
        >
          <p className="text-lg leading-relaxed">
            En Horycore, estamos construyendo una <span className="text-secondary-color font-semibold">comunidad de empresas</span> que están listas para crecer de manera inteligente. Aunque recién comenzamos, cada una de nuestras primeras empresas clientes está confirmando que Horycore es la herramienta que necesitan para <span className="text-white font-medium">simplificar sus operaciones</span> y sentar las bases de su futuro.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6"
        >
          <p className="text-lg leading-relaxed">
            Estamos enfocados en ofrecerte una solución que <span className="text-secondary-color font-semibold">se adapte a tu etapa de crecimiento</span> y que te ayude a <span className="text-white font-medium">optimizar tus procesos desde el primer día</span>.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-12"
        >
          <p className="text-lg leading-relaxed">
            ¿Estás listo para <span className="text-secondary-color font-semibold">dar el primer paso</span>? Contacta con nosotros hoy mismo y descubre cómo Horycore puede empezar a <span className="text-white font-medium">transformar la gestión de tu negocio</span>.
          </p>
        </motion.div>

        {/* CTA Card */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-10 rounded-3xl border border-secondary-color/40 overflow-hidden group hover:border-secondary-color/60 transition-all duration-500"
        >
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-primary-color/5 opacity-70"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary-color/20 to-transparent rounded-full blur-2xl"></div>
          
          {/* Contenido principal */}
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Lado izquierdo: Icono y texto */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  {/* Icono moderno */}
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-2xl border-2 border-secondary-color/40 flex items-center justify-center mr-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary-color to-primary-color rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-1 group-hover:text-secondary-color transition-colors duration-300">
                      ¿Quieres saber más?
                    </h4>
                    <div className="w-20 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color rounded-full"></div>
                  </div>
                </div>
                
                <p className="text-secondary-text text-lg leading-relaxed mb-6 lg:mb-0">
                  Solicita una <span className="text-white font-semibold">demostración gratuita</span> y descubre todo lo que nuestro ERP puede hacer por tu empresa
                </p>
              </div>
              
              {/* Lado derecho: Botón de acción */}
              <div className="flex-shrink-0">
                <a 
                  href="/contacto" 
                  className="group/btn relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-secondary-color to-primary-color text-white font-bold text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-secondary-color/30 hover:scale-105 active:scale-95"
                >
                  {/* Efecto de brillo al hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Texto del botón */}
                  <span className="relative z-10 mr-2">Solicitar Demo</span>
                  
                  {/* Icono de flecha */}
                  <div className="relative z-10 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover/btn:bg-white/30 transition-colors duration-300">
                    <div className="w-2.5 h-2.5 border-r-2 border-t-2 border-white transform rotate-45 group-hover/btn:translate-x-0.5 transition-transform duration-300"></div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

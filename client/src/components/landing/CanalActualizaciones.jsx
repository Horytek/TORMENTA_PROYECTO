import { motion } from 'framer-motion';

export const CanalActualizaciones = () => {
  return (
    <section className="w-full py-16 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
        {/* Bloque de contacto */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-secondary-color/20 to-primary-color/20 blur-lg rounded-2xl"></div>
          <div className="relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-xl border border-secondary-color/30">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">¿Necesitas Ayuda con la Actualización?</h3>
                <p className="text-secondary-text mb-4">Nuestro equipo técnico te acompaña en cada actualización para garantizar una transición sin problemas.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-bgDark1 p-3 rounded-lg border border-gray-600/30">
                    <span className="text-primary-color font-semibold block mb-1">Soporte</span>
                    <a href="mailto:javierrojasq.0612@gmail.com" className="text-white hover:text-secondary-color transition-colors duration-300">javierrojasq.0612@gmail.com</a>
                  </div>
                  
                  <div className="bg-bgDark1 p-3 rounded-lg border border-gray-600/30">
                    <span className="text-primary-color font-semibold block mb-1">WhatsApp</span>
                    <a href="tel:+51961797720" className="text-white hover:text-secondary-color transition-colors duration-300">+51 961 797 720</a>
                  </div>
                  
                  <div className="bg-bgDark1 p-3 rounded-lg border border-gray-600/30">
                    <span className="text-primary-color font-semibold block mb-1">Horario</span>
                    <span className="text-white">Lun-Vie: 8AM - 8PM</span>
                  </div>
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

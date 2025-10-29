import { motion } from "framer-motion";

export const ActualizacionesContent = () => {
  return (
    <section className="w-full pt-16 pb-8 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
              <h2 className="text-3xl font-bold text-white">Versión Actual - 2.0</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
            </div>
            <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6">
              <p className="text-lg leading-relaxed text-secondary-text">La versión más avanzada con <span className="text-secondary-color font-semibold">Chatbot Inteligente con IA</span> y nuevas integraciones para una <span className="text-white font-medium">gestión empresarial asistida</span>. Lanzada en octubre de 2025.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 mb-8">
              <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl flex items-center justify-center border border-secondary-color/30 mr-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-secondary-color to-primary-color rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-white group-hover:text-secondary-color transition-colors duration-300">Chatbot Inteligente</h4>
                  </div>
                  <div className="w-30 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-4 rounded-full"></div>
                  <p className="text-secondary-text leading-relaxed">Asistente virtual con IA que te ayuda en tiempo real con consultas, navegación y soporte en toda la plataforma.</p>
                </div>
              </div>
              
              <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl flex items-center justify-center border border-secondary-color/30 mr-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-secondary-color to-primary-color rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-white group-hover:text-secondary-color transition-colors duration-300">Dashboard Mejorado</h4>
                  </div>
                  <div className="w-30 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-4 rounded-full"></div>
                  <p className="text-secondary-text leading-relaxed">Interfaz rediseñada con widgets personalizables y métricas en tiempo real.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

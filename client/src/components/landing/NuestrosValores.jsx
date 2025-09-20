import { motion } from "framer-motion";

export const NuestrosValores = () => {
  const valores = [
    {
      title: "Innovación Constante",
      description: "Nos mantenemos a la vanguardia tecnológica, implementando las últimas tendencias en desarrollo de software y metodologías ágiles."
    },
    {
      title: "Enfoque al Cliente",
      description: "Cada funcionalidad está diseñada pensando en las necesidades reales de nuestros usuarios y su experiencia de uso."
    },
    {
      title: "Seguridad y Confianza",
      description: "Implementamos los más altos estándares de seguridad para proteger la información empresarial de nuestros clientes."
    },
    {
      title: "Crecimiento Sostenible",
      description: "Desarrollamos soluciones escalables que crecen junto con tu empresa, adaptándose a nuevos desafíos y oportunidades."
    }
  ];

  return (
    <div className="flex justify-center w-full py-12 bg-gradient-to-b from-bgDark1 to-bgDark2 relative pt-2">
      <div className="px-2 sm:px-4">
        <article className="p-8 rounded-3xl w-full lg:w-[1200px] 2xl:w-[1400px]">
          <section className="text-secondary-text !leading-7 sm:!leading-8 text-base sm:text-lg text-left sm:text-justify mx-auto w-full md:w-10/12 lg:w-2/3">
        {/* Título */}
        <motion.div 
          className="flex items-center mb-6"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">Nuestros Valores</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </motion.div>
        
        {/* Grid de valores */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {valores.map((valor, index) => (
            <motion.div 
              key={index}
              className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl flex items-center justify-center border border-secondary-color/30 mr-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-secondary-color to-primary-color rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-sm"></div>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-white group-hover:text-secondary-color transition-colors duration-300">
                    {valor.title}
                  </h4>
                </div>
                <div className="w-30 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-4 rounded-full"></div>
                <p className="text-secondary-text leading-relaxed">
                  {valor.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
          </section>
        </article>
      </div>
    </div>
  );
};

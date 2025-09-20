import { motion } from "framer-motion";

export const NuestraEmpresa = () => {
  return (
    <div className="flex justify-center bg-gradient-to-b from-bgDark1 to-bgDark2 relative pt-2">
      <div className="px-2 sm:px-4">
        <article className="p-8 rounded-3xl w-full lg:w-[1200px] 2xl:w-[1400px] mb-8 mt-16 sm:mt-24">
          
          <section className="text-secondary-text !leading-7 sm:!leading-8 text-base sm:text-lg text-left sm:text-justify mx-auto w-full md:w-10/12 lg:w-2/3">
            
            {/* ¿Quiénes Somos? */}
            <motion.div 
              className="mb-16"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
                <h2 className="text-3xl font-bold text-white">¿Quiénes Somos?</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <p className="text-lg leading-relaxed text-secondary-text">
                  En <strong className="text-secondary-color">Horycore</strong>, creemos que las empresas, sin importar su tamaño, merecen herramientas de gestión potentes y accesibles. Hemos creado Horycore con una misión clara: <span className="text-white font-semibold">simplificar la complejidad diaria de tu negocio</span>.
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <p className="text-lg leading-relaxed text-secondary-text">
              Aunque estamos empezando, nuestro compromiso es ofrecerte un sistema ERP que te ayude a <span className="text-secondary-color font-medium">centralizar tus operaciones</span>, <span className="text-secondary-color font-medium">tomar decisiones informadas</span> y, en última instancia, <span className="text-white font-semibold">crecer de manera más inteligente</span>. Estamos construyendo el futuro del ERP de la mano de nuestros primeros clientes, y cada una de tus sugerencias nos ayuda a hacerlo mejor.
            </p>
          </motion.div>
        </motion.div>

        {/* Nuestra Misión */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="flex items-center mb-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-white">Nuestra Misión</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-lg leading-relaxed">
              Ofrecer a las pequeñas y medianas empresas una herramienta <span className="text-secondary-color font-semibold">accesible y fácil de usar</span> que les ayude a organizar y optimizar sus procesos de gestión, facilitando el control del negocio y mejorando la toma de decisiones con <span className="text-white font-medium">información clara y centralizada</span>.
            </p>
          </motion.div>
        </motion.div>

        {/* Nuestra Visión */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="flex items-center mb-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-white">Nuestra Visión</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
          </motion.div>
          <motion.div 
            className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-lg leading-relaxed text-secondary-text">
              Convertirnos en una <span className="text-secondary-color font-semibold">alternativa confiable de ERP</span> en el mercado local, <span className="text-white font-medium">creciendo junto a nuestros clientes</span> y adaptándonos a sus necesidades, con el objetivo de expandirnos gradualmente a más empresas en Perú.
            </p>
          </motion.div>
        </motion.div>
        
          </section>
        </article>
      </div>
    </div>
  );
};

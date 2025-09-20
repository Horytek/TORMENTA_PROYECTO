import { motion } from "framer-motion";

export const AboutHero = () => {
  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 pt-20">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary-color/5 to-primary-color/5"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary-color/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-tr from-primary-color/20 to-transparent rounded-full blur-2xl"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-24">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center bg-gradient-to-r from-secondary-color/20 to-primary-color/20 rounded-full px-6 py-3 mb-8 border border-secondary-color/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-2 h-2 bg-secondary-color rounded-full mr-3 animate-pulse"></div>
            <span className="text-secondary-color font-semibold text-sm">Conoce a HoryCore</span>
          </motion.div>
          
          {/* Título principal */}
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Sobre{" "}
            <span className="bg-gradient-to-r from-secondary-color to-primary-color bg-clip-text text-transparent">
              Nosotros
            </span>
          </motion.h1>
          
          {/* Subtítulo */}
          <motion.p 
            className="text-xl md:text-2xl text-secondary-text max-w-4xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Conoce la historia, visión y valores que impulsan a Horycore en la{" "}
            <span className="text-white font-semibold">transformación digital empresarial</span>.
          </motion.p>
          
          {/* Línea decorativa */}
          <motion.div 
            className="w-32 h-1 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "8rem" }}
            transition={{ duration: 0.8, delay: 0.8 }}
          ></motion.div>
        </motion.div>
      </div>
    </section>
  );
};
import { motion } from "framer-motion";

export const NuestraEmpresa = () => {
  return (
    <div className="flex justify-center bg-transparent pt-24 pb-12">
      <div className="px-4 w-full xl:w-[1280px]">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          {/* Left Column: Narrative */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-secondary-color font-bold tracking-widest text-xs uppercase mb-4 block">Sobre Nosotros</span>
              <h2 className="text-4xl text-white font-bold mb-8 leading-tight">
                Simplificando la gestión empresarial en el Perú.
              </h2>

              <div className="prose prose-lg prose-invert text-secondary-text leading-relaxed">
                <p className="mb-6">
                  En Horycore, creemos que las empresas merecen herramientas potentes sin la complejidad tradicional.
                  Hemos creado un ecosistema donde la contabilidad, las ventas y la logística conversan entre sí.
                </p>
                <p>
                  Nuestro compromiso es ser el motor silencioso detrás de tu crecimiento, ofreciendo tecnología
                  que normalmente solo tienen las grandes corporaciones, democratizada para tu negocio.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Mission Quote Card */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 relative overflow-hidden"
            >
              {/* Decorative Quote Icon */}
              <div className="absolute top-6 left-6 text-white/5 text-8xl font-serif select-none pointer-events-none">"</div>

              <h3 className="text-white font-bold text-xl mb-6 relative z-10">Nuestra Misión</h3>
              <p className="text-lg text-white/90 italic leading-relaxed relative z-10 mb-8">
                "Empoderar a las PyMEs peruanas con software de clase mundial, accesible y fácil de usar, eliminando las barreras de la transformación digital."
              </p>

              <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                <div className="w-10 h-10 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color font-bold">
                  HC
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Equipo HoryCore</p>
                  <p className="text-xs text-white/50">Lima, Perú</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Vision / Key Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            { title: "Control", desc: "Información centralizada en tiempo real." },
            { title: "Seguridad", desc: "Protección de datos con estándares bancarios." },
            { title: "Futuro", desc: "Actualizaciones constantes sin costo extra." }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              viewport={{ once: true }}
              className="border-l border-white/10 pl-6"
            >
              <h4 className="text-white font-bold text-lg mb-2">{item.title}</h4>
              <p className="text-sm text-secondary-text">{item.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

import { motion } from "framer-motion";

export const TeamMembers = () => {
  return (
    <div className="flex justify-center bg-transparent relative pt-2">
      <div className="px-2 sm:px-4">
        <article className="w-full lg:w-[1200px] 2xl:w-[1400px] mb-24 mt-16 sm:mt-24">

          <section className="text-secondary-text !leading-7 sm:!leading-8 text-base sm:text-lg text-left sm:text-justify mx-auto w-full md:w-10/12 lg:w-2/3">

            {/* Sección del Equipo Principal */}
            <motion.div
              className="text-white text-3xl font-bold mb-6 text-center"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              Equipo HoryCore
            </motion.div>

            <motion.div
              className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <p className="text-lg leading-relaxed text-gray-300">
                Nuestro equipo está formado por los <span className="text-white font-bold">líderes y arquitectos</span>, quienes definen la visión estratégica y <span className="text-white font-bold">guían el desarrollo del producto</span>.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {/* Marco Rioja */}
              <motion.div
                className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-secondary-color/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mb-6 flex items-center justify-center shadow-lg border-2 border-white/5 group-hover:border-secondary-color/50 transition-colors">
                    <span className="text-white font-bold text-2xl">MR</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Marco Rioja</h3>
                  <p className="text-secondary-color font-bold text-xs uppercase tracking-widest mb-4">CTO & Arquitecto</p>
                  <p className="text-gray-400 text-sm leading-relaxed">Responsable de la arquitectura técnica y la escalabilidad de Horycore. Supervisa el desarrollo del núcleo del sistema.</p>
                </div>
              </motion.div>

              {/* Davist Bustamante - CEO destacado */}
              <motion.div
                className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-secondary-color/30 hover:border-secondary-color/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-secondary-color/10 to-transparent pointer-events-none"></div>
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-br from-secondary-color to-blue-600 rounded-full mb-6 flex items-center justify-center shadow-2xl shadow-secondary-color/20 ring-4 ring-white/10">
                    <span className="text-white font-bold text-3xl">DB</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Davist Bustamante</h3>
                  <p className="text-white font-bold text-xs uppercase tracking-widest mb-4 bg-white/20 px-3 py-1 rounded-full">CEO & Fundador</p>
                  <p className="text-gray-200 text-sm leading-relaxed font-medium">Visionario y líder del proyecto Horycore. Dirige la estrategia general y la innovación tecnológica de la empresa.</p>
                </div>
              </motion.div>

              {/* Andree Requejo */}
              <motion.div
                className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-secondary-color/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mb-6 flex items-center justify-center shadow-lg border-2 border-white/5 group-hover:border-secondary-color/50 transition-colors">
                    <span className="text-white font-bold text-2xl">AR</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Andree Requejo</h3>
                  <p className="text-secondary-color font-bold text-xs uppercase tracking-widest mb-4">Director TI</p>
                  <p className="text-gray-400 text-sm leading-relaxed">Lidera la investigación y desarrollo de nuevas funcionalidades. Mantiene Horycore a la vanguardia tecnológica.</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Segunda fila centrada */}
            <motion.div
              className="flex justify-center mt-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
                {/* Ángel Montenegro */}
                <motion.div
                  className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-secondary-color/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mb-6 flex items-center justify-center shadow-lg border-2 border-white/5 group-hover:border-secondary-color/50 transition-colors">
                      <span className="text-white font-bold text-2xl">ÁM</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ángel Montenegro</h3>
                    <p className="text-secondary-color font-bold text-xs uppercase tracking-widest mb-4">Director Ops</p>
                    <p className="text-gray-400 text-sm leading-relaxed">Optimiza los procesos internos y la eficiencia operativa. Coordina los equipos para garantizar entregas de calidad.</p>
                  </div>
                </motion.div>

                {/* Fernando Fernandez */}
                <motion.div
                  className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-secondary-color/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mb-6 flex items-center justify-center shadow-lg border-2 border-white/5 group-hover:border-secondary-color/50 transition-colors">
                      <span className="text-white font-bold text-2xl">FF</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Fernando Fernandez</h3>
                    <p className="text-secondary-color font-bold text-xs uppercase tracking-widest mb-4">Director Producto</p>
                    <p className="text-gray-400 text-sm leading-relaxed">Especialista en experiencia de usuario. Asegura que Horycore sea intuitivo y cumpla con las necesidades reales de los clientes.</p>
                  </div>
                </motion.div>

                {/* Javier Rojas */}
                <motion.div
                  className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-secondary-color/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mb-6 flex items-center justify-center shadow-lg border-2 border-white/5 group-hover:border-secondary-color/50 transition-colors">
                      <span className="text-white font-bold text-2xl">JR</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Javier Rojas</h3>
                    <p className="text-secondary-color font-bold text-xs uppercase tracking-widest mb-4">Gerente General</p>
                    <p className="text-gray-400 text-sm leading-relaxed">Supervisa las operaciones generales de HoryCore. Coordina los equipos y asegura el cumplimiento de los objetivos estratégicos.</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Sección del Equipo de Apoyo */}
            <div className="mt-20 mb-12">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12"></div>
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 text-center">
                <p className="text-lg leading-relaxed text-gray-300">Además contamos con <span className="text-white font-bold">especialistas de élite</span> que apoyan en desarrollo, seguridad y mejora continua.</p>
              </div>
            </div>

            {/* Grid Equipo Apoyo */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {['Adrian Portocarrero', 'Julio Castañeda', 'Armando Infante', 'Juan Forero', 'Johan Torres'].map((name, idx) => {
                const initials = name.split(' ').map(n => n[0]).join('');
                const roles = [
                  'Full Stack Senior',
                  'Full Stack Senior',
                  'Especialista BD',
                  'DBA Senior',
                  'Analista de Datos'
                ];

                return (
                  <motion.div
                    key={name}
                    className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 hover:border-secondary-color/30 transition-all duration-300 hover:bg-white/10 flex items-center gap-4 group"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-white shrink-0 group-hover:bg-secondary-color group-hover:text-black transition-colors">
                      {initials}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{name}</h4>
                      <p className="text-gray-400 text-xs">{roles[idx]}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

          </section>
        </article>
      </div>
    </div>
  );
};

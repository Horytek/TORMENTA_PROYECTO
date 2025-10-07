import { motion } from "framer-motion";

export const TeamMembers = () => {
  return (
    <div className="flex justify-center bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 relative pt-2">
      <div className="px-2 sm:px-4">
        <article className="p-8 rounded-3xl w-full lg:w-[1200px] 2xl:w-[1400px] mb-24 mt-16 sm:mt-24">
          
          <section className="text-secondary-text !leading-7 sm:!leading-8 text-base sm:text-lg text-left sm:text-justify mx-auto w-full md:w-10/12 lg:w-2/3">
            
            {/* Sección del Equipo Principal */}
            <motion.div 
              className="text-white text-2xl mb-4"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              Equipo HoryCore
            </motion.div>
            <motion.div 
              className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-8"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <p className="text-lg leading-relaxed text-secondary-text">Nuestro equipo está formado por los <span className="text-secondary-color font-semibold">líderes y arquitectos de Horycore</span>, quienes definen la visión estratégica y <span className="text-white font-medium">guían el desarrollo del producto</span>:</p>
            </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {/* Marco Rioja */}
          <motion.div 
            className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">MR</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Marco Rioja</h3>
              <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">CTO & Arquitecto de Software</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
              <p className="text-secondary-text text-sm leading-relaxed">Responsable de la arquitectura técnica y la escalabilidad de Horycore. Supervisa el desarrollo del núcleo del sistema.</p>
            </div>
          </motion.div>
          
          {/* Davist Bustamante - CEO destacado */}
          <motion.div 
            className="bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border-2 border-secondary-color/40 hover:border-secondary-color/70 transition-all duration-300 hover:shadow-2xl hover:shadow-secondary-color/20 relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent pointer-events-none"></div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-secondary-color via-primary-color to-secondary-color rounded-full mb-6 flex items-center justify-center shadow-2xl shadow-secondary-color/30 ring-2 ring-secondary-color/20">
                <span className="text-white font-bold text-2xl">DB</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Davist Bustamante</h3>
              <p className="text-secondary-color font-bold mb-4 text-sm uppercase tracking-wide">CEO & Fundador</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
              <p className="text-secondary-text text-sm leading-relaxed">Visionario y líder del proyecto Horycore. Dirige la estrategia general y la innovación tecnológica de la empresa.</p>
            </div>
          </motion.div>
          
          {/* Andree Requejo */}
          <motion.div 
            className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">AR</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Andree Requejo</h3>
              <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Director de Tecnología e Innovación</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
              <p className="text-secondary-text text-sm leading-relaxed">Lidera la investigación y desarrollo de nuevas funcionalidades. Mantiene Horycore a la vanguardia tecnológica.</p>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Segunda fila centrada */}
        <motion.div 
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl">
            {/* Ángel Montenegro */}
            <motion.div 
              className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">ÁM</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ángel Montenegro</h3>
                <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Director de Operaciones</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
                <p className="text-secondary-text text-sm leading-relaxed">Optimiza los procesos internos y la eficiencia operativa. Coordina los equipos para garantizar entregas de calidad.</p>
              </div>
            </motion.div>
            
            {/* Fernando Fernandez */}
            <motion.div 
              className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">FF</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fernando Fernandez</h3>
                <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Director de Producto</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
                <p className="text-secondary-text text-sm leading-relaxed">Especialista en experiencia de usuario. Asegura que Horycore sea intuitivo y cumpla con las necesidades reales de los clientes.</p>
              </div>
            </motion.div>

            {/* Javier Rojas */}
            <motion.div 
              className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">JR</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Javier Rojas</h3>
                <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Gerente de HoryCore</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
                <p className="text-secondary-text text-sm leading-relaxed">Supervisa las operaciones generales de HoryCore. Coordina los equipos y asegura el cumplimiento de los objetivos estratégicos.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Sección del Equipo de Apoyo */}
        <br/>
        <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-8">
          <p className="text-lg leading-relaxed">Además contamos con <span className="text-secondary-color font-semibold">especialistas que apoyan</span> en áreas clave del desarrollo, testing, base de datos, soporte y <span className="text-white font-medium">mejora continua del sistema</span>:</p>
        </div>
        
        {/* Primera fila del equipo de apoyo */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {/* Adrian Portocarrero */}
          <motion.div 
            className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">AP</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Adrian Portocarrero</h3>
              <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Desarrollador Full Stack Senior</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
              <p className="text-secondary-text text-sm leading-relaxed">Especialista en desarrollo frontend y backend. Contribuye al desarrollo de interfaces y lógica del servidor.</p>
            </div>
          </motion.div>
          
          {/* Armando Infante */}
          <motion.div 
            className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">AI</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Julio Castañeda</h3>
              <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Desarrollador Full Stack Senior</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
              <p className="text-secondary-text text-sm leading-relaxed">Especialista en desarrollo frontend y backend. Contribuye al desarrollo de interfaces y lógica del servidor.</p>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Segunda fila centrada del equipo de apoyo */}
        <motion.div 
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl">
            {/* Julio Castañeda */}
            <motion.div 
              className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">JC</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Armando Infante</h3>
                <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Especialista en Base de datos</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
                <p className="text-secondary-text text-sm leading-relaxed">Responsable del diseño y optimización de bases de datos. Garantiza el rendimiento y la integridad de los datos.</p>
              </div>
            </motion.div>
            
            {/* Juan Forero */}
            <motion.div 
              className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">JF</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Juan Forero</h3>
                <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Administrador de Bases de Datos</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
                <p className="text-secondary-text text-sm leading-relaxed">Especialista en administración y mantenimiento de bases de datos. Asegura la disponibilidad y seguridad de la información.</p>
              </div>
            </motion.div>
            
            {/* Johan Torres */}
            <motion.div 
              className="bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-color/10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mb-6 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">JT</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Johan Torres</h3>
                <p className="text-secondary-color font-semibold mb-4 text-sm uppercase tracking-wide">Analista de Datos</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-4"></div>
                <p className="text-secondary-text text-sm leading-relaxed">Especialista en análisis y modelado de datos. Optimiza las consultas y reportes para mejorar el rendimiento del sistema.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
          </section>
        </article>
      </div>
    </div>
  );
};

import { motion } from "framer-motion";

export const InformacionContacto = () => {
  const contactMethods = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      ),
      title: "Email",
      primary: "javierrojasq.0612@gmail.com",
      secondary: "javierrojasq.0612@gmail.com",
      description: "Consultas sobre productos y atención al cliente",
      color: "secondary-color",
      gradient: "from-secondary-color/20 to-primary-color/20"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
      ),
      title: "Teléfono",
      primary: "+51 961 797 720",
      secondary: "+51 961 797 720",
      description: "Consultas sobre productos y disponibilidad",
      color: "primary-color",
      gradient: "from-primary-color/20 to-secondary-color/20"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      ),
      title: "WhatsApp",
      primary: "+51 961 797 720",
      secondary: "Javier Rojas - Gerente",
      description: "Asesoría directa con el Gerente de HoryCore",
      color: "green-400",
      gradient: "from-green-400/20 to-green-500/20"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      title: "Sede Principal",
      primary: "Galería Central",
      secondary: "AV. ARICA 1028 INT 22",
      description: "Chiclayo, Perú",
      color: "secondary-color",
      gradient: "from-secondary-color/20 to-primary-color/20"
    }
  ];

  const scheduleInfo = [
    {
      day: "Lunes - Sábado",
      hours: "9:00 AM - 8:00 PM",
      type: "Horario de tienda"
    },
    {
      day: "Domingos",
      hours: "10:00 AM - 6:00 PM",
      type: "Horario especial"
    },
    {
      day: "Feriados",
      hours: "Consultar disponibilidad",
      type: "Horario variable"
    }
  ];

  return (
    <section className="w-full py-16 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1" id="informacion-contacto">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-full md:w-10/12 lg:w-2/3 xl:w-3/4 2xl:w-[1000px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center mb-12">
            <div className="w-2 h-8 bg-gradient-to-b from-primary-color to-secondary-color rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-white">Múltiples formas de contactarnos</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary-color/30 to-transparent ml-6"></div>
          </div>
        </motion.div>

        <div className="px-2 sm:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Métodos de contacto */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative bg-gradient-to-br from-bgDark2 via-bgDark1 to-bgDark2 p-6 rounded-2xl border border-gray-600/30 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${method.gradient} rounded-xl flex items-center justify-center border border-${method.color}/30`}>
                        <div className={`text-${method.color}`}>
                          {method.icon}
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-secondary-color transition-colors duration-300">
                      {method.title}
                    </h4>
                    
                    <div className="space-y-1 mb-3">
                      <p className="text-white font-medium">{method.primary}</p>
                      <p className="text-secondary-text text-sm">{method.secondary}</p>
                    </div>
                    
                    <p className="text-secondary-text text-sm leading-relaxed">
                      {method.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Horarios de atención */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-bgDark2 via-bgDark1 to-bgDark2 p-8 rounded-2xl border border-primary-color/30 h-full"
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-color/20 to-secondary-color/20 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white">Horarios de Atención</h4>
              </div>

              <div className="space-y-4">
                {scheduleInfo.map((schedule, index) => (
                  <div key={index} className="border-l-2 border-primary-color/30 pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white font-medium text-sm">{schedule.day}</span>
                    </div>
                    <div className="text-secondary-color font-semibold">{schedule.hours}</div>
                    <div className="text-secondary-text text-xs">{schedule.type}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-primary-color/10 rounded-xl border border-primary-color/20">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">Soporte de emergencia</span>
                </div>
                <p className="text-secondary-text text-xs">
                  Para consultas sobre productos y soluciones empresariales, contáctanos por WhatsApp.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Llamada a la acción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              ¿Necesitas una respuesta inmediata?
            </h3>
            <p className="text-secondary-text mb-6">
              Contacta directamente con <span className="text-secondary-color font-semibold">Javier Rojas</span>, Gerente de HoryCore, para recibir asesoría personalizada sobre nuestros productos y soluciones empresariales.
            </p>
            <a
              href="https://wa.me/51961797720"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              Chatear por WhatsApp
            </a>
          </div>
        </motion.div>
        </div>
        </div>
      </div>
    </section>
  );
};

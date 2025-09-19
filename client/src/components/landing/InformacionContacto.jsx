import { motion } from "framer-motion";

export const InformacionContacto = () => {
  const contactMethods = [
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      ),
      title: "Email",
      primary: "ventas@horytek.com",
      secondary: "atencion@horytek.com",
      description: "Consultas sobre productos y atención al cliente",
      color: "secondary-color",
      gradient: "from-secondary-color/20 to-primary-color/20"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      ),
      title: "Teléfono",
      primary: "+51 987 654 321",
      secondary: "+51 123 456 789",
      description: "Consultas sobre productos y disponibilidad",
      color: "primary-color",
      gradient: "from-primary-color/20 to-secondary-color/20"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
          <path d="M11.893 5.5c2.298 0 4.163 1.867 4.163 4.165 0 2.298-1.865 4.164-4.163 4.164s-4.164-1.866-4.164-4.164c0-2.298 1.866-4.165 4.164-4.165z"/>
        </svg>
      ),
      title: "WhatsApp",
      primary: "+51 949 423 702",
      secondary: "Atención personalizada",
      description: "Asesoría de moda y consultas rápidas",
      color: "green-400",
      gradient: "from-green-400/20 to-green-500/20"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
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
                  Para consultas sobre productos y asesoría de moda, contáctanos por WhatsApp.
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
              Nuestro equipo está disponible para atenderte por WhatsApp y brindarte asesoría personalizada sobre nuestros productos.
            </p>
            <a
              href="https://wa.me/51949423702"
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

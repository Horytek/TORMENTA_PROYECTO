import { motion } from "framer-motion";

export const UbicacionOficinas = () => {
  const oficinas = [
    {
      nombre: "Galería Central",
      direccion: "AV. ARICA 1028 INT 22 GALERIA CENTRAL",
      ciudad: "Chiclayo",
      pais: "Perú",
      tipo: "Tienda de Ropa",
      telefono: "+51 987 654 321",
      email: "central@horytek.com",
      horario: "Lunes - Sábado: 9:00 AM - 8:00 PM",
      servicios: ["Venta de ropa", "Atención al cliente", "Asesoría de moda"],
      destacada: true
    },
    {
      nombre: "Galería D'Angelo",
      direccion: "AV. BALTA 1444 INT. 01 GALERIA D ANGELO",
      ciudad: "Chiclayo",
      pais: "Perú",
      tipo: "Tienda de Ropa",
      telefono: "+51 123 456 789",
      email: "dangelo@horytek.com",
      horario: "Lunes - Sábado: 9:00 AM - 8:00 PM",
      servicios: ["Venta de ropa", "Atención al cliente", "Asesoría de moda"],
      destacada: false
    },
    {
      nombre: "San Martín",
      direccion: "CAL. SAN MARTIN NRO. 1573",
      ciudad: "Chiclayo",
      pais: "Perú",
      tipo: "Tienda de Ropa",
      telefono: "+51 456 789 123",
      email: "sanmartin@horytek.com",
      horario: "Lunes - Sábado: 9:00 AM - 8:00 PM",
      servicios: ["Venta de ropa", "Atención al cliente", "Asesoría de moda"],
      destacada: false
    }
  ];

  return (
    <section className="w-full py-16 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1" id="ubicacion-oficinas">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-full md:w-10/12 lg:w-2/3 xl:w-3/4 2xl:w-[1000px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center mb-12">
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-white">Nuestras sedes</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
          </div>
        </motion.div>

        <div className="px-2 sm:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {oficinas.map((oficina, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border transition-all duration-500 hover:shadow-2xl overflow-hidden ${
                oficina.destacada 
                  ? 'border-secondary-color/50 hover:border-secondary-color/70 hover:shadow-secondary-color/20' 
                  : 'border-gray-600/30 hover:border-primary-color/40 hover:shadow-primary-color/10'
              }`}
            >
              {oficina.destacada && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-secondary-color to-primary-color text-white text-xs font-bold px-3 py-1 rounded-full">
                  Principal
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{oficina.nombre}</h3>
                    <p className="text-secondary-color font-medium">{oficina.tipo}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${
                    oficina.destacada 
                      ? 'from-secondary-color/20 to-primary-color/20 border-secondary-color/30' 
                      : 'from-primary-color/20 to-secondary-color/20 border-primary-color/30'
                  } rounded-xl flex items-center justify-center border`}>
                    <svg className={`w-6 h-6 ${oficina.destacada ? 'text-secondary-color' : 'text-primary-color'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Dirección */}
                <div className="mb-6">
                  <div className="flex items-start mb-2">
                    <svg className="w-4 h-4 text-secondary-text mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">{oficina.direccion}</p>
                      <p className="text-secondary-text text-sm">{oficina.ciudad}, {oficina.pais}</p>
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-secondary-text mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="text-white text-sm">{oficina.telefono}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-secondary-text mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-white text-sm">{oficina.email}</span>
                  </div>

                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-secondary-text mt-1 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white text-sm">{oficina.horario}</span>
                  </div>
                </div>

                {/* Servicios */}
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3 text-sm">Servicios disponibles:</h4>
                  <div className="flex flex-wrap gap-2">
                    {oficina.servicios.map((servicio, serviceIndex) => (
                      <span
                        key={serviceIndex}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          oficina.destacada
                            ? 'bg-secondary-color/10 text-secondary-color border border-secondary-color/20'
                            : 'bg-primary-color/10 text-primary-color border border-primary-color/20'
                        }`}
                      >
                        {servicio}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3">
                  <button className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    oficina.destacada
                      ? 'bg-secondary-color/10 text-secondary-color border border-secondary-color/30 hover:bg-secondary-color/20'
                      : 'bg-primary-color/10 text-primary-color border border-primary-color/30 hover:bg-primary-color/20'
                  }`}>
                    Ver en mapa
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-secondary-color/20 to-primary-color/20 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-secondary-color/30 hover:to-primary-color/30 transition-all duration-200">
                    Contactar
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mapa o información adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/30 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Expandiendo nuestro alcance
              </h3>
              <p className="text-secondary-text mb-6 max-w-2xl mx-auto">
                Estamos creciendo constantemente para estar más cerca de nuestros clientes. 
                Próximamente abriremos nuevas oficinas en Cusco, Piura y otras ciudades importantes del Perú.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">3 oficinas activas</span>
                </div>
                
                <div className="flex items-center bg-secondary-color/10 px-4 py-2 rounded-full border border-secondary-color/20">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mr-2"></div>
                  <span className="text-secondary-color text-sm font-medium">2 nuevas oficinas en 2026</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
        </div>
      </div>
    </section>
  );
};

export const CanalActualizaciones = () => {
  return (
    <section className="w-full py-16 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
          <div className="flex items-center mb-8">
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-white">Canal de Actualizaciones</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
          </div>
          
          <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-8">
            <p className="text-lg leading-relaxed text-secondary-text">
              Mantente al día con todas las <span className="text-primary-color font-semibold">novedades y mejoras</span> de HoryCore a través de nuestros <span className="text-white font-medium">diferentes canales de comunicación</span>.
            </p>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Canal Newsletter */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 rounded-2xl border border-gray-600/20 hover:border-secondary-color/50 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-color/10 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl border border-secondary-color/40 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">Newsletter Mensual</h3>
              <p className="text-secondary-text mb-4">Suscríbete para recibir todas las novedades, tips de uso y casos de éxito directamente en tu correo.</p>
              
              <div className="mt-auto pt-4">
                <div className="relative">
                  <input type="email" placeholder="Tu correo electrónico" className="w-full px-4 py-3 bg-bgDark1 border border-gray-600/50 rounded-lg focus:outline-none focus:border-secondary-color/70 text-sm text-white" />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-secondary-color to-primary-color text-white rounded-md text-sm font-medium">
                    Suscribirse
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Canales adicionales */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-6 rounded-2xl border border-gray-600/20 hover:border-primary-color/50 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-color/10 rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-color/20 to-primary-color/10 rounded-xl border border-primary-color/40 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-9a1 1 0 011 1v4a1 1 0 01-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">Más Canales de Información</h3>
              
              <ul className="space-y-4 mt-2">
                <li className="flex items-start">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-color/20 to-transparent rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Webinars</h4>
                    <p className="text-sm text-secondary-text">Demostraciones en vivo de nuevas funcionalidades todos los miércoles a las 7:00 PM.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary-color/20 to-transparent rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Centro de Ayuda</h4>
                    <p className="text-sm text-secondary-text">Documentación actualizada y tutoriales paso a paso para todas las funciones.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-color/20 to-transparent rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Soporte Técnico</h4>
                    <p className="text-sm text-secondary-text">Asistencia personalizada para migración y capacitación en cada actualización.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bloque de contacto */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-secondary-color/20 to-primary-color/20 blur-lg rounded-2xl"></div>
          <div className="relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-xl border border-secondary-color/30">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">¿Necesitas Ayuda con la Actualización?</h3>
                <p className="text-secondary-text mb-4">Nuestro equipo técnico te acompaña en cada actualización para garantizar una transición sin problemas.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-bgDark1 p-3 rounded-lg border border-gray-600/30">
                    <span className="text-primary-color font-semibold block mb-1">Soporte</span>
                    <a href="mailto:soporte@horytek.com" className="text-white hover:text-secondary-color transition-colors duration-300">soporte@horytek.com</a>
                  </div>
                  
                  <div className="bg-bgDark1 p-3 rounded-lg border border-gray-600/30">
                    <span className="text-primary-color font-semibold block mb-1">WhatsApp</span>
                    <a href="tel:+51987654321" className="text-white hover:text-secondary-color transition-colors duration-300">+51 987 654 321</a>
                  </div>
                  
                  <div className="bg-bgDark1 p-3 rounded-lg border border-gray-600/30">
                    <span className="text-primary-color font-semibold block mb-1">Horario</span>
                    <span className="text-white">Lun-Vie: 8AM - 8PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

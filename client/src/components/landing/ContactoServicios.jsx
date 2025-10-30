export const ContactoServicios = ({ onOpenModal }) => {
  return (
    <section className="w-full py-16 bg-gradient-to-br from-bgDark2 via-bgDark1 to-bgDark2">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
          <div className="flex items-center mb-8">
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl font-bold text-white">¿Listo para transformar tu empresa?</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Main CTA */}
            <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden">
              {/* Elementos decorativos sutiles */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center bg-secondary-color/10 px-4 py-2 rounded-full text-secondary-color text-sm mb-6 border border-secondary-color/30">
                <span className="w-2 h-2 bg-secondary-color rounded-full mr-2 animate-pulse"></span>
                Transformación empresarial garantizada
              </div>
              
              <p className="text-lg text-secondary-text mb-8 leading-relaxed">
                Solicita una demostración personalizada y descubre cómo <span className="text-secondary-color font-semibold">HoryCore puede revolucionar</span> la gestión de tu negocio
              </p>
              
              <div className="w-24 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-8 rounded-full mx-auto"></div>

              {/* Contact Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-bgDark1 p-6 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-secondary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-2">Email</h4>
                  <p className="text-secondary-text text-sm">javierrojasq.0612@gmail.com</p>
                </div>
                
                <div className="bg-bgDark1 p-6 rounded-2xl border border-gray-600/30 hover:border-primary-color/50 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-color/20 to-secondary-color/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-2">WhatsApp</h4>
                  <p className="text-secondary-text text-sm">+51 961 797 720</p>
                </div>
                
                <div className="bg-bgDark1 p-6 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-secondary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-2">Horario</h4>
                  <p className="text-secondary-text text-sm">Lun-Vie: 8AM - 8PM</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center">
                <button 
                  onClick={onOpenModal}
                  className="bg-gradient-to-r from-secondary-color to-primary-color text-white px-10 py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-xl"
                >
                  Solicitar Demo - HoryCore
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center bg-bgDark2/50 p-6 rounded-xl border border-gray-600/30">
              <div className="text-4xl font-bold text-white mb-2">+5</div>
              <div className="text-secondary-text">Módulos implementados</div>
            </div>
            <div className="text-center bg-bgDark2/50 p-6 rounded-xl border border-gray-600/30">
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-secondary-text">Enfoque de innovación</div>
            </div>
            <div className="text-center bg-bgDark2/50 p-6 rounded-xl border border-gray-600/30">
              <div className="text-4xl font-bold text-white mb-2">1+</div>
              <div className="text-secondary-text">Años de experiencia</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-12">
            <p className="text-secondary-text text-sm">
              ~ Equipo Comercial HoryTek
            </p>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

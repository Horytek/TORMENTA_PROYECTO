export const ContactoServicios = () => {
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
                    <svg className="w-6 h-6 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-2">Email</h4>
                  <p className="text-secondary-text text-sm">contacto@horytek.com</p>
                </div>
                
                <div className="bg-bgDark1 p-6 rounded-2xl border border-gray-600/30 hover:border-primary-color/50 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-color/20 to-secondary-color/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-2">WhatsApp</h4>
                  <p className="text-secondary-text text-sm">+51 987 654 321</p>
                </div>
                
                <div className="bg-bgDark1 p-6 rounded-2xl border border-gray-600/30 hover:border-secondary-color/50 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-secondary-color" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-white font-semibold mb-2">Horario</h4>
                  <p className="text-secondary-text text-sm">Lun-Vie: 8AM - 8PM</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-gradient-to-r from-secondary-color to-primary-color text-white px-10 py-4 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-xl">
                  Solicitar Demo Gratuita
                </button>
                <button className="border border-gray-600/50 text-white px-10 py-4 rounded-xl font-semibold hover:bg-bgDark2 transition-all duration-300">
                  Agendar Reunión
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center bg-bgDark2/50 p-6 rounded-xl border border-gray-600/30">
              <div className="text-4xl font-bold text-white mb-2">7,500+</div>
              <div className="text-secondary-text">Empresas confían en nosotros</div>
            </div>
            <div className="text-center bg-bgDark2/50 p-6 rounded-xl border border-gray-600/30">
              <div className="text-4xl font-bold text-white mb-2">98.5%</div>
              <div className="text-secondary-text">Satisfacción del cliente</div>
            </div>
            <div className="text-center bg-bgDark2/50 p-6 rounded-xl border border-gray-600/30">
              <div className="text-4xl font-bold text-white mb-2">15+</div>
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

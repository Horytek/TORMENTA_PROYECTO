export const PorQueElegir = () => {
  return (
    <section className="w-full py-24 bg-gradient-to-b from-bgDark2 to-bgDark1">
      <div className="max-w-6xl mx-auto px-8">
        {/* Título */}
        <div className="flex items-center mb-6">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">¿Por Qué Elegir HoryCore?</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        
        {/* Grid de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {/* Card 1: Satisfacción del cliente */}
          <div className="group relative bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/50 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/15 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 text-center">
              {/* Círculo decorativo */}
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-full border-2 border-secondary-color/30"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-secondary-color to-primary-color rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">98</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary-color rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">%</span>
                </div>
              </div>
              
              <h4 className="text-lg font-bold text-white mb-3 group-hover:text-secondary-color transition-colors duration-300">
                Satisfacción del Cliente
              </h4>
              <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-3"></div>
              <p className="text-secondary-text text-sm leading-relaxed">
                Nuestros clientes confirman la calidad y eficiencia de HoryCore
              </p>
            </div>
          </div>
          
          {/* Card 2: Reducción de costos */}
          <div className="group relative bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/50 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/15 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 text-center">
              {/* Gráfico de barras minimalista */}
              <div className="relative mx-auto w-24 h-24 mb-6 flex items-end justify-center space-x-2">
                <div className="w-3 h-16 bg-gradient-to-t from-secondary-color/30 to-secondary-color/60 rounded-t-full"></div>
                <div className="w-3 h-12 bg-gradient-to-t from-primary-color/40 to-primary-color/70 rounded-t-full"></div>
                <div className="w-3 h-20 bg-gradient-to-t from-secondary-color to-primary-color rounded-t-full relative">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-secondary-color text-white text-xs font-bold px-2 py-1 rounded-full">
                    40%
                  </div>
                </div>
                <div className="w-3 h-8 bg-gradient-to-t from-gray-600/40 to-gray-500/60 rounded-t-full"></div>
              </div>
              
              <h4 className="text-lg font-bold text-white mb-3 group-hover:text-secondary-color transition-colors duration-300">
                Reducción de Costos
              </h4>
              <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-3"></div>
              <p className="text-secondary-text text-sm leading-relaxed">
                Promedio de ahorro en costos operativos de nuestros clientes
              </p>
            </div>
          </div>
          
          {/* Card 3: Soporte 24/7 */}
          <div className="group relative bg-gradient-to-br from-bgDark1 to-bgDark2 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/50 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/15 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 text-center">
              {/* Reloj minimalista */}
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-secondary-color/30 rounded-full"></div>
                <div className="absolute inset-2 border-2 border-secondary-color/50 rounded-full bg-gradient-to-br from-secondary-color/10 to-primary-color/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">24</div>
                    <div className="text-secondary-color text-xs font-semibold">7</div>
                  </div>
                </div>
                {/* Pequeños puntos indicadores */}
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-secondary-color rounded-full"></div>
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-secondary-color rounded-full"></div>
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-2 h-1 bg-secondary-color rounded-full"></div>
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-1 bg-secondary-color rounded-full"></div>
              </div>
              
              <h4 className="text-lg font-bold text-white mb-3 group-hover:text-secondary-color transition-colors duration-300">
                Soporte Continuo
              </h4>
              <div className="w-16 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mx-auto rounded-full mb-3"></div>
              <p className="text-secondary-text text-sm leading-relaxed">
                Asistencia técnica especializada disponible las 24 horas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

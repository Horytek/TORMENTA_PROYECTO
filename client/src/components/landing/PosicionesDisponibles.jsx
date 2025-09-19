export const PosicionesDisponibles = () => {
  return (
    <section className="w-full py-24 bg-gradient-to-b from-bgDark1 to-bgDark2">
      <div className="max-w-6xl mx-auto px-8">
        {/* Título */}
        <div className="flex items-center mb-8">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">Posiciones Disponibles</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>

        {/* Job Card */}
        <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-3xl border border-gray-600/20 transition-all duration-500 overflow-hidden mb-8">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-primary-color/5 opacity-0 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary-color/10 to-transparent rounded-full blur-2xl"></div>
          
          {/* Contenido principal */}
          <div className="relative z-10">
            {/* Header del trabajo */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-2xl border-2 border-secondary-color/40 flex items-center justify-center mr-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary-color to-primary-color rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 transition-colors duration-300">Sistema Tormenta - Ventas</h3>
                    <p className="text-secondary-color font-semibold text-lg">Especialista en Ventas y Gestión Comercial</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-4 rounded-xl border-l-4 border-secondary-color/50">
                    <p className="text-xs uppercase tracking-wider text-secondary-color font-bold mb-1">Modalidad</p>
                    <p className="text-white font-semibold">Remoto / Híbrido</p>
                  </div>
                  <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-4 rounded-xl border-l-4 border-primary-color/50">
                    <p className="text-xs uppercase tracking-wider text-secondary-color font-bold mb-1">Experiencia</p>
                    <p className="text-white font-semibold">2-4 años</p>
                  </div>
                  <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-4 rounded-xl border-l-4 border-secondary-color/50">
                    <p className="text-xs uppercase tracking-wider text-secondary-color font-bold mb-1">Tipo</p>
                    <p className="text-white font-semibold">Tiempo Completo</p>
                  </div>
                </div>
              </div>
              
              {/* Botón de aplicar */}
              <div className="flex-shrink-0">
                <button className="group/btn relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-secondary-color to-primary-color text-white font-bold text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-secondary-color/30 hover:scale-105 active:scale-95">
                  {/* Efecto de brillo al hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Texto del botón */}
                  <span className="relative z-10 mr-2">Aplicar Ahora</span>
                  
                  {/* Icono de flecha */}
                  <div className="relative z-10 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover/btn:bg-white/30 transition-colors duration-300">
                    <div className="w-2.5 h-2.5 border-r-2 border-t-2 border-white transform rotate-45 group-hover/btn:translate-x-0.5 transition-transform duration-300"></div>
                  </div>
                </button>
              </div>
            </div>

            {/* Descripción del trabajo */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-white mb-4">Descripción del Puesto</h4>
                <div className="bg-gradient-to-r from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40">
                  <p className="text-lg leading-relaxed text-secondary-text">
                    Buscamos un <span className="text-secondary-color font-semibold">especialista en ventas</span> apasionado por la tecnología para unirse a nuestro equipo y liderar la expansión comercial de Horycore. Serás responsable de <span className="text-white font-medium">identificar oportunidades de negocio</span>, desarrollar relaciones con clientes y contribuir al crecimiento de nuestra plataforma ERP.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-white mb-4">Responsabilidades Principales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text">Prospección y desarrollo de nuevos clientes</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text">Presentaciones comerciales de Horycore ERP</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text">Seguimiento y cierre de oportunidades</span>
                    </li>
                  </ul>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text">Análisis de mercado y competencia</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text">Colaboración con el equipo de desarrollo</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text">Reportes de ventas y métricas</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-white mb-4">Requisitos</h4>
                <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-secondary-color/40">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-3 h-3 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text"><span className="text-white font-medium">Experiencia en ventas B2B</span>, preferiblemente en software o tecnología</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-3 h-3 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text"><span className="text-white font-medium">Conocimiento en sistemas ERP</span> o gestión empresarial</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-3 h-3 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text"><span className="text-white font-medium">Excelentes habilidades de comunicación</span> y presentación</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-3 h-3 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                      <span className="text-secondary-text"><span className="text-white font-medium">Orientación a resultados</span> y capacidad de trabajo en equipo</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-white mb-4">¿Qué Ofrecemos?</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-secondary-color/10 to-primary-color/5 p-6 rounded-2xl border border-secondary-color/20">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary-color to-primary-color rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h5 className="text-lg font-bold text-white mb-2">Salario Competitivo</h5>
                    <p className="text-secondary-text text-sm">Remuneración acorde al mercado más comisiones por ventas</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-primary-color/10 to-secondary-color/5 p-6 rounded-2xl border border-primary-color/20">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-color to-secondary-color rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h5 className="text-lg font-bold text-white mb-2">Crecimiento Profesional</h5>
                    <p className="text-secondary-text text-sm">Oportunidades de desarrollo en una empresa en expansión</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-secondary-color/10 to-primary-color/5 p-6 rounded-2xl border border-secondary-color/20">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary-color to-primary-color rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                      </svg>
                    </div>
                    <h5 className="text-lg font-bold text-white mb-2">Trabajo Flexible</h5>
                    <p className="text-secondary-text text-sm">Modalidad remota e híbrida con horarios flexibles</p>
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
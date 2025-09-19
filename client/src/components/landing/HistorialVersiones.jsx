import React from 'react';

export const HistorialVersiones = () => {
  return (
    <section className="w-full pb-8 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
        <div className="flex items-center mb-8">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">Historial de Versiones</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        
        {/* Versión 4.2.0 */}
        <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-3xl border border-gray-600/20 transition-all duration-500 overflow-hidden mb-8 hover:border-secondary-color/40">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-primary-color/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary-color/10 to-transparent rounded-full blur-2xl"></div>
          
          {/* Contenido principal */}
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl border border-secondary-color/40 flex items-center justify-center mr-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-secondary-color to-primary-color rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-bold">4.2</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1 transition-colors duration-300">Versión 4.2.0 - ACTUAL</h3>
                  <p className="text-secondary-color font-semibold">Septiembre 2025</p>
                </div>
              </div>
              <span className="bg-secondary-color text-bgDark1 px-4 py-1 rounded-full text-xs font-bold inline-block w-fit">NUEVA</span>
            </div>
            
            <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6">
              <p className="text-lg leading-relaxed text-secondary-text">
                La versión más avanzada con <span className="text-secondary-color font-semibold">IA Predictiva</span> y nuevas integraciones para una <span className="text-white font-medium">gestión empresarial inteligente</span>.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-3"></div>
                <h4 className="text-xl font-semibold text-white">Nuevas Funcionalidades</h4>
              </div>
              <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">IA Predictiva:</strong> Análisis predictivo para demanda y stock usando inteligencia artificial</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Facturación QR:</strong> Generación automática de códigos QR en comprobantes electrónicos</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Dashboard Móvil:</strong> Nuevos dashboards optimizados para dispositivos móviles</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Integración WhatsApp:</strong> Envío automático de comprobantes y notificaciones via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-3"></div>
                <h4 className="text-xl font-semibold text-white">Mejoras</h4>
              </div>
              <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Velocidad de carga mejorada en un 40%</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Nueva interfaz de usuario más intuitiva</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Reportes con exportación a Excel mejorada</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Versión 4.1.5 */}
        <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 transition-all duration-500 overflow-hidden mb-8 hover:border-primary-color/40">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-color/20 to-primary-color/10 rounded-xl border border-primary-color/30 flex items-center justify-center mr-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-color to-primary-color/50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-bold">4.1</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 transition-colors duration-300">Versión 4.1.5</h3>
                  <p className="text-primary-color font-semibold">Agosto 2025</p>
                </div>
              </div>
              <span className="bg-primary-color text-white px-4 py-1 rounded-full text-xs font-bold inline-block w-fit">ESTABLE</span>
            </div>

            <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6">
              <p className="text-lg leading-relaxed text-secondary-text">
                Versión estable con <span className="text-primary-color font-semibold">optimización de facturación</span> y <span className="text-white font-medium">mejoras significativas de rendimiento</span>.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-primary-color to-primary-color/50 rounded-full mr-3"></div>
                <h4 className="text-xl font-semibold text-white">Mejoras Principales</h4>
              </div>
              <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Optimización del módulo de facturación electrónica</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Mejoras en la gestión de inventarios por lotes</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Nueva función de backup automático diario</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Versión 4.1.0 */}
        <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 transition-all duration-500 overflow-hidden mb-8 hover:border-secondary-color/40">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl border border-secondary-color/30 flex items-center justify-center mr-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-secondary-color/80 to-primary-color/80 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-bold">4.1</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 transition-colors duration-300">Versión 4.1.0</h3>
                  <p className="text-secondary-color font-semibold">Julio 2025</p>
                </div>
              </div>
              <span className="bg-secondary-color text-bgDark1 px-4 py-1 rounded-full text-xs font-bold inline-block w-fit">MAYOR</span>
            </div>
            
            <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6">
              <p className="text-lg leading-relaxed text-secondary-text">
                Gran actualización con <span className="text-secondary-color font-semibold">funciones multiempresa</span> y <span className="text-white font-medium">mejoras de integración</span>.
              </p>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-3"></div>
                <h4 className="text-xl font-semibold text-white">Características Destacadas</h4>
              </div>
              <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Módulo CRM Avanzado:</strong> Gestión completa del ciclo de ventas</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">API REST Completa:</strong> Integración con sistemas externos</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Multi-empresa:</strong> Gestión de múltiples empresas desde una cuenta</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

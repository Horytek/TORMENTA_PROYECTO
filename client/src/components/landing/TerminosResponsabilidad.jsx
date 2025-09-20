import { motion } from 'framer-motion';

export const TerminosResponsabilidad = () => {
  return (
    <div className="flex justify-center bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 relative pt-2">
      <div className="px-2 sm:px-4">
        <motion.article 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="p-8 rounded-3xl w-full lg:w-[1200px] 2xl:w-[1400px] mb-24 mt-16 sm:mt-24"
        >
          
          <section className="text-secondary-text !leading-7 sm:!leading-8 text-base sm:text-lg text-left sm:text-justify mx-auto w-full md:w-10/12 lg:w-2/3">
            
            <div className="space-y-8">
          {/* Sección 1: Limitación de Responsabilidad */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 transition-all duration-500 overflow-hidden hover:border-secondary-color/40">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-primary-color/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl border border-secondary-color/40 flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Limitación de Responsabilidad
                  </h2>
                  <p className="text-secondary-text leading-relaxed mb-4">
                    En la máxima medida permitida por la ley, HoryTek no será responsable por <span className="text-secondary-color font-semibold">daños indirectos, incidentales, especiales</span> o consecuentes que puedan surgir del uso de nuestros servicios.
                  </p>
                  <div className="bg-gradient-to-br from-bgDark2/80 to-bgDark2/40 p-4 rounded-xl border border-gray-600/20">
                    <p className="text-secondary-text text-sm">
                      <span className="text-white font-medium">Límite:</span> Nuestra responsabilidad total estará limitada al monto pagado por el cliente por los servicios en los últimos 12 meses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Facturación y Pagos */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 transition-all duration-500 overflow-hidden hover:border-primary-color/40">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-color/20 to-primary-color/10 rounded-xl border border-primary-color/40 flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Facturación y Pagos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-bgDark2/80 to-bgDark2/40 p-6 rounded-xl border border-gray-600/20">
                      <h4 className="text-secondary-color font-semibold mb-3 text-lg flex items-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                          <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                        </svg>
                        Términos de Pago
                      </h4>
                      <p className="text-secondary-text text-sm leading-relaxed">
                        Los términos de facturación y pago se establecen en el contrato específico de cada cliente. Los pagos deben realizarse según los <span className="text-white font-medium">plazos acordados</span>.
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-bgDark2/80 to-bgDark2/40 p-6 rounded-xl border border-gray-600/20">
                      <h4 className="text-primary-color font-semibold mb-3 text-lg flex items-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                        </svg>
                        Incumplimiento
                      </h4>
                      <p className="text-secondary-text text-sm leading-relaxed">
                        El incumplimiento en los pagos puede resultar en la <span className="text-white font-medium">suspensión temporal</span> de los servicios hasta que se regularice la situación.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 3: Terminación del Servicio */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 transition-all duration-500 overflow-hidden hover:border-secondary-color/40">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-primary-color/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl border border-secondary-color/40 flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Terminación del Servicio
                  </h2>
                  <div className="space-y-4">
                    <p className="text-secondary-text leading-relaxed">
                      Cualquiera de las partes puede terminar el contrato de servicios de acuerdo con los <span className="text-secondary-color font-semibold">términos específicos</span> establecidos en el acuerdo comercial.
                    </p>
                    <p className="text-secondary-text leading-relaxed">
                      En caso de terminación, HoryTek proporcionará a los clientes un <span className="text-white font-medium">período razonable para la migración</span> de sus datos, según lo establecido en el contrato.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 4: Modificaciones de los Términos */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 transition-all duration-500 overflow-hidden hover:border-primary-color/40">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-color/20 to-secondary-color/20 rounded-xl border border-primary-color/40 flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Modificaciones de los Términos
                  </h2>
                  <p className="text-secondary-text leading-relaxed mb-4">
                    HoryTek se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones serán notificadas a los usuarios con al menos <span className="text-primary-color font-semibold">30 días de anticipación</span>.
                  </p>
                  <div className="bg-gradient-to-br from-bgDark2/80 to-bgDark2/40 p-4 rounded-xl border border-primary-color/30">
                    <p className="text-secondary-text text-sm">
                      <span className="text-white font-medium">Aceptación:</span> El uso continuado de los servicios después de la notificación constituye la aceptación de los nuevos términos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 5: Ley Aplicable y Jurisdicción */}
          <div className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 transition-all duration-500 overflow-hidden hover:border-secondary-color/40">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-primary-color/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-xl border border-secondary-color/40 flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white font-bold text-lg">5</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Ley Aplicable y Jurisdicción
                  </h2>
                  <div className="flex items-start space-x-4">
                    <div className="flex justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-secondary-color">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
                      </svg>
                    </div>
                    <p className="text-secondary-text leading-relaxed">
                      Estos términos y condiciones se rigen por las <span className="text-secondary-color font-semibold">leyes de la República del Perú</span>. Cualquier disputa será resuelta en los <span className="text-white font-medium">tribunales competentes de Lima, Perú</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-10 rounded-2xl border border-gray-600/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-color/10 to-secondary-color/10"></div>
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-primary-color/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-secondary-color/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-color/20 to-secondary-color/20 rounded-xl border border-primary-color/40 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">6</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Información de <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-color to-primary-color">Contacto</span>
                </h2>
                <p className="text-secondary-text max-w-2xl mx-auto text-lg">
                  Para cualquier consulta sobre estos términos y condiciones, puede contactarnos a través de:
                </p>
              </div>

              {/* Contact Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="group bg-gradient-to-br from-bgDark2/80 to-bgDark2/40 rounded-xl p-6 text-center border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-300">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-secondary-color">
                      <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                    </svg>
                  </div>
                  <h4 className="text-secondary-color font-semibold mb-2 text-lg">Email</h4>
                  <p className="text-secondary-text text-sm">javierrojasq.0612@gmail.com</p>
                </div>
                
                <div className="group bg-gradient-to-br from-bgDark2/80 to-bgDark2/40 rounded-xl p-6 text-center border border-gray-600/20 hover:border-primary-color/40 transition-all duration-300">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary-color">
                      <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                    </svg>
                  </div>
                  <h4 className="text-primary-color font-semibold mb-2 text-lg">Teléfono</h4>
                  <p className="text-secondary-text text-sm">+51 961 797 720</p>
                </div>
                
                <div className="group bg-gradient-to-br from-bgDark2/80 to-bgDark2/40 rounded-xl p-6 text-center border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-300">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-secondary-color">
                      <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"/>
                    </svg>
                  </div>
                  <h4 className="text-secondary-color font-semibold mb-2 text-lg">Dirección</h4>
                  <p className="text-secondary-text text-sm">Lima, Perú</p>
                </div>
              </div>
              
              {/* Last Updated */}
              <div className="bg-gradient-to-br from-bgDark2/80 to-bgDark2/40 rounded-xl p-4 text-center border border-gray-600/20">
                <p className="text-secondary-text text-sm">
                  <span className="text-white font-medium">Última actualización:</span> {new Date().toLocaleDateString("es-PE", {
                    year: "numeric",
                    month: "long", 
                    day: "numeric"
                  })}
                </p>
              </div>

              {/* Footer */}
              <div className="text-center mt-6">
                <p className="text-secondary-text text-sm">
                  ~ Equipo Legal HoryTek
                </p>
              </div>
            </div>
          </div>
            </div>
            
          </section>
        </motion.article>
      </div>
    </div>
  );
};

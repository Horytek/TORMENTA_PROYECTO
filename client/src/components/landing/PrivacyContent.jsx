export const PrivacyContent = () => {
  return (
    <div className="flex justify-center bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 relative pt-2">
      <div className="px-2 sm:px-4">
        <article className="p-8 rounded-3xl w-full lg:w-[1200px] 2xl:w-[1400px] mb-24 mt-16 sm:mt-24">
          
          <section className="text-secondary-text !leading-7 sm:!leading-8 text-base sm:text-lg text-left sm:text-justify mx-auto w-full md:w-10/12 lg:w-2/3">
            
            {/* Introducción */}
            <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-8">
              <p className="text-lg leading-relaxed text-secondary-text">En HoryCore, nos comprometemos a <span className="text-secondary-color font-semibold">proteger la privacidad y seguridad</span> de los datos de nuestros usuarios. Esta política describe cómo recopilamos, utilizamos, protegemos y divulgamos la información personal cuando utilizas nuestro <span className="text-white font-medium">sistema ERP HoryCore</span> y nuestros servicios relacionados.</p>
            </div>

            {/* Sección 1 */}
            <div className="flex items-center mb-6 mt-12">
              <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
              <h2 className="text-3xl font-bold text-white">1. Información que Recopilamos</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
            </div>
            <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6">
              <p className="text-lg leading-relaxed text-secondary-text">Como proveedor de <span className="text-secondary-color font-semibold">soluciones ERP empresariales</span>, recopilamos diferentes tipos de información para brindarte el <span className="text-white font-medium">mejor servicio posible</span>:</p>
            </div>
            <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Información de registro:</strong> Nombre, correo electrónico, teléfono, empresa y cargo.</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Datos empresariales:</strong> Información financiera, inventarios, clientes, proveedores y transacciones comerciales.</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Información técnica:</strong> Dirección IP, tipo de navegador, sistema operativo y datos de uso del sistema.</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Datos de facturación:</strong> Información necesaria para la emisión de comprobantes electrónicos según normativas SUNAT.</span>
          </li>
        </ul>

        {/* Sección 2 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">2. Cómo Utilizamos tu Información</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6">
          <p className="text-lg leading-relaxed text-secondary-text">Utilizamos la información recopilada para los siguientes <span className="text-secondary-color font-semibold">propósitos legítimos</span>:</p>
        </div>
        <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Proporcionar y mantener nuestros servicios ERP</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Procesar transacciones y generar reportes empresariales</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Cumplir con obligaciones fiscales y regulatorias (SUNAT, tributarias)</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Mejorar la funcionalidad y seguridad de nuestros sistemas</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Brindar soporte técnico y atención al cliente</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Enviar actualizaciones importantes sobre el servicio</span>
          </li>
        </ul>

        {/* Sección 3 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">3. Protección y Seguridad de Datos</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6">
          <p className="text-lg leading-relaxed text-secondary-text">Implementamos <span className="text-secondary-color font-semibold">medidas de seguridad robustas</span> para <span className="text-white font-medium">proteger tu información</span>:</p>
        </div>
        <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Encriptación:</strong> Todos los datos se transmiten y almacenan con encriptación de nivel empresarial (AES-256)</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Acceso controlado:</strong> Sistema de autenticación multifactor y control de permisos por roles</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Respaldos seguros:</strong> Copias de seguridad automáticas y redundantes en servidores seguros</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Monitoreo continuo:</strong> Supervisión 24/7 para detectar y prevenir accesos no autorizados</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Auditorías regulares:</strong> Evaluaciones periódicas de seguridad y vulnerabilidades</span>
          </li>
        </ul>

        {/* Sección 4 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">4. Compartir Información</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6">
          <p className="text-lg leading-relaxed text-secondary-text"><span className="text-secondary-color font-semibold">No vendemos, alquilamos ni compartimos</span> tu información personal con terceros, excepto en las siguientes <span className="text-white font-medium">circunstancias específicas</span>:</p>
        </div>
        <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Proveedores de servicios:</strong> Empresas que nos ayudan a operar nuestros servicios (hosting, soporte técnico)</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Cumplimiento legal:</strong> Cuando sea requerido por ley, como reportes a SUNAT o autoridades competentes</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Protección de derechos:</strong> Para proteger nuestros derechos legales o la seguridad de nuestros usuarios</span>
          </li>
        </ul>

        {/* Sección 5 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">5. Retención de Datos</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6">
          <p className="text-lg leading-relaxed">Conservamos tu información personal durante el <span className="text-secondary-color font-semibold">tiempo necesario</span> para cumplir con los propósitos descritos en esta política, <span className="text-white font-medium">incluyendo</span>:</p>
        </div>
        <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Mientras mantengas una cuenta activa con nosotros</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Para cumplir con obligaciones legales y fiscales (mínimo 5 años según normativa peruana)</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Para resolver disputas y hacer cumplir nuestros acuerdos</span>
          </li>
        </ul>

        {/* Sección 6 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">6. Tus Derechos</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6">
          <p className="text-lg leading-relaxed">Como usuario de HoryCore, tienes los siguientes <span className="text-secondary-color font-semibold">derechos sobre tus datos personales</span>:</p>
        </div>
        <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Acceso:</strong> Solicitar una copia de la información personal que tenemos sobre ti</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Rectificación:</strong> Corregir información inexacta o incompleta</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Eliminación:</strong> Solicitar la eliminación de tus datos (sujeto a obligaciones legales)</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Portabilidad:</strong> Recibir tus datos en un formato estructurado y legible</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Oposición:</strong> Oponerte al procesamiento de tus datos en ciertas circunstancias</span>
          </li>
        </ul>

        {/* Sección 7 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">7. Cookies y Tecnologías Similares</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6">
          <p className="text-lg leading-relaxed">Utilizamos <span className="text-secondary-color font-semibold">cookies y tecnologías similares</span> para <span className="text-white font-medium">mejorar tu experiencia</span> en HoryCore:</p>
        </div>
        <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Cookies esenciales para el funcionamiento del sistema</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Cookies de preferencias para recordar tus configuraciones</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Cookies analíticas para mejorar nuestros servicios (datos anonimizados)</span>
          </li>
        </ul>

        {/* Sección 8 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">8. Transferencias Internacionales</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-8">
          <p className="text-lg leading-relaxed">Tus datos se procesan principalmente en <span className="text-secondary-color font-semibold">servidores ubicados en Perú</span>. En caso de transferencias internacionales, garantizamos que se realicen con las <span className="text-white font-medium">protecciones adecuadas</span> y cumpliendo con las normativas locales e internacionales.</p>
        </div>

        {/* Sección 9 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">9. Cambios a esta Política</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6">
          <p className="text-lg leading-relaxed">Podemos actualizar esta política de privacidad ocasionalmente. Te <span className="text-secondary-color font-semibold">notificaremos sobre cambios significativos</span> mediante:</p>
        </div>
        <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Notificación dentro del sistema HoryCore</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Correo electrónico a tu dirección registrada</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span>Publicación en nuestro sitio web con fecha de actualización</span>
          </li>
        </ul>

        {/* Sección 10 */}
        <div className="flex items-center mb-6 mt-12">
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">10. Contacto</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </div>
        <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6">
          <p className="text-lg leading-relaxed">Si tienes preguntas sobre esta política de privacidad o sobre el <span className="text-secondary-color font-semibold">manejo de tus datos personales</span>, puedes <span className="text-white font-medium">contactarnos</span>:</p>
        </div>
        <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Correo electrónico:</strong> privacidad@horycore.com</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Teléfono:</strong> +51 1 234-5678</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Dirección:</strong> Av. Tecnología 123, San Isidro, Lima, Perú</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span><strong className="text-white">Horario de atención:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM</span>
          </li>
        </ul>

        {/* Fecha de actualización */}
        <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mt-12 mb-6">
          <p className="text-lg leading-relaxed"><strong className="text-white">Fecha de última actualización:</strong> <span className="text-secondary-color font-semibold">{new Date().toLocaleDateString("es-PE", {
            year: "numeric",
            month: "long", 
            day: "numeric"
          })}</span></p>
        </div>
        
        {/* Mensaje final */}
        <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mt-6">
          <p className="text-lg leading-relaxed text-secondary-text">En HoryCore, <span className="text-secondary-color font-semibold">tu confianza es fundamental</span> para nosotros. Trabajamos constantemente para mantener los <span className="text-white font-medium">más altos estándares de privacidad y seguridad</span> en todos nuestros servicios ERP.</p>
        </div>
        
          </section>
        </article>
      </div>
    </div>
  );
};

import { motion } from "framer-motion";

export const ModulosPrincipales = ({ onOpenModal }) => {
  const modulos = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"/>
        </svg>
      ),
      titulo: "Contabilidad y Finanzas",
      color: "from-primary-color to-secondary-color",
      descripcion: "Gestión financiera integral y automatizada",
      caracteristicas: [
        "Contabilidad general automatizada",
        "Libros electrónicos PLEs integrados con SUNAT",
        "Control de flujo de caja y tesorería",
        "Reportes financieros en tiempo real",
        "Conciliación bancaria automática",
        "Gestión de activos fijos"
      ]
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M19,7H18V6A2,2 0 0,0 16,4H8A2,2 0 0,0 6,6V7H5A3,3 0 0,0 2,10V19A3,3 0 0,0 5,22H19A3,3 0 0,0 22,19V10A3,3 0 0,0 19,7M8,6H16V7H8V6Z"/>
        </svg>
      ),
      titulo: "Ventas y CRM",
      color: "from-secondary-color to-primary-color",
      descripcion: "Optimiza tu fuerza de ventas y relación con clientes",
      caracteristicas: [
        "Gestión de clientes y prospectos",
        "Cotizaciones y pedidos de venta",
        "Facturación electrónica SUNAT",
        "Control de comisiones de vendedores",
        "Análisis de ventas y rentabilidad",
        "Seguimiento de pipeline de ventas"
      ]
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
        </svg>
      ),
      titulo: "Inventarios y Almacén",
      color: "from-primary-color to-secondary-color",
      descripcion: "Control total de stock y movimientos",
      caracteristicas: [
        "Control de stock en tiempo real",
        "Gestión de múltiples almacenes",
        "Trazabilidad completa de productos",
        "Valorización de inventarios (FIFO, LIFO, Promedio)",
        "Alertas de stock mínimo",
        "Código de barras y etiquetado"
      ]
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,3H1M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z"/>
        </svg>
      ),
      titulo: "Compras y Proveedores",
      color: "from-secondary-color to-primary-color",
      descripcion: "Optimización de procesos de adquisición",
      caracteristicas: [
        "Gestión de proveedores y cotizaciones",
        "Órdenes de compra automatizadas",
        "Control de recepciones y devoluciones",
        "Evaluación de proveedores",
        "Planificación de requerimientos",
        "Gestión de contratos y acuerdos"
      ]
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M16,4C16.88,4 17.67,4.5 18,5.26L19,7H20A2,2 0 0,1 22,9V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V9A2,2 0 0,1 4,7H5L6,5.26C6.33,4.5 7.12,4 8,4H16M16.5,10A1.5,1.5 0 0,0 15,11.5V12.5A1.5,1.5 0 0,0 16.5,14A1.5,1.5 0 0,0 18,12.5V11.5A1.5,1.5 0 0,0 16.5,10M7.5,10A1.5,1.5 0 0,0 6,11.5V12.5A1.5,1.5 0 0,0 7.5,14A1.5,1.5 0 0,0 9,12.5V11.5A1.5,1.5 0 0,0 7.5,10Z"/>
        </svg>
      ),
      titulo: "Recursos Humanos",
      color: "from-primary-color to-secondary-color",
      descripcion: "Gestión integral del capital humano",
      caracteristicas: [
        "Gestión de personal y nóminas",
        "Control de asistencia y marcaciones",
        "Cálculo automático de planillas",
        "Gestión de vacaciones y permisos",
        "Evaluación de desempeño",
        "Reportes laborales"
      ]
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M7,2V4H8V18A4,4 0 0,0 12,22A4,4 0 0,0 16,18V4H17V2H7M11,16C10.4,16 10,15.6 10,15C10,14.4 10.4,14 11,14C11.6,14 12,14.4 12,15C12,15.6 11.6,16 11,16M13,12C12.4,12 12,11.6 12,11C12,10.4 12.4,10 13,10C13.6,10 14,10.4 14,11C14,11.6 13.6,12 13,12M14,7H10V4H14V7Z"/>
        </svg>
      ),
      titulo: "Producción",
      color: "from-secondary-color to-primary-color",
      descripcion: "Planificación y control de manufactura",
      caracteristicas: [
        "Planificación de la producción",
        "Control de órdenes de trabajo",
        "Gestión de recetas y fórmulas",
        "Control de calidad integrado",
        "Seguimiento de costos de producción",
        "Optimización de recursos productivos"
      ]
    }
  ];

  return (
    <section className="w-full py-20 bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1" id="modulos">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
          {/* Header de la sección */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Módulos Principales</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6 max-w-32"></div>
          </div>
          
          <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 max-w-4xl mx-auto">
            <p className="text-lg leading-relaxed text-secondary-text">
              Cada módulo está diseñado para <span className="text-secondary-color font-semibold">optimizar una área específica</span> de tu empresa, trabajando en <span className="text-white font-medium">perfecta sincronía</span> para una gestión integral.
            </p>
          </div>
        </motion.div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {modulos.map((modulo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 hover:border-secondary-color/40 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary-color/10 overflow-hidden"
            >
              {/* Elementos decorativos de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-color/10 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary-color/10 to-transparent rounded-full blur-2xl"></div>
              
              {/* Contenido principal */}
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-color/20 to-primary-color/20 rounded-2xl border border-secondary-color/30 flex items-center justify-center mr-4 text-3xl group-hover:scale-105 transition-transform duration-300">
                    {modulo.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-secondary-color transition-colors duration-300">
                      {modulo.titulo}
                    </h3>
                    <p className="text-secondary-text text-sm mt-1">{modulo.descripcion}</p>
                  </div>
                </div>

                <div className="w-24 h-0.5 bg-gradient-to-r from-secondary-color to-primary-color mb-6 rounded-full"></div>

                <div className="space-y-3">
                  {modulo.caracteristicas.map((caracteristica, idx) => (
                    <div key={idx} className="flex items-start group/item">
                      <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0 group-hover/item:bg-primary-color transition-colors duration-200"></div>
                      <span className="text-secondary-text text-sm leading-relaxed group-hover/item:text-white transition-colors duration-200">{caracteristica}</span>
                    </div>
                  ))}
                </div>

                {/* Badge de importancia */}
                <div className="mt-6 pt-4 border-t border-gray-600/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary-color font-medium bg-secondary-color/10 px-3 py-1 rounded-full">
                      Módulo esencial
                    </span>
                    <div className="flex items-center text-xs text-secondary-text">
                      <div className="w-1 h-1 bg-green-400 rounded-full mr-1"></div>
                      Totalmente integrado
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-8 rounded-2xl border border-secondary-color/20 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">¿Necesitas más información?</h3>
            <p className="text-secondary-text mb-6">
              Cada módulo puede personalizarse según las necesidades específicas de tu empresa
            </p>
            <button 
              onClick={onOpenModal}
              className="bg-gradient-to-r from-secondary-color to-primary-color text-white px-8 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-secondary-color/30 transition-all duration-300"
            >
              Solicitar demostración
            </button>
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
};

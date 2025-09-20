import { motion } from 'framer-motion';

export const QueEsHorycore = () => {
  return (
    <section className="w-full py-12 bg-gradient-to-b from-bgDark2 to-bgDark1">
      <div className="flex justify-center relative pt-2">
        <div className="px-2 sm:px-4">
          <motion.article 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl w-full lg:w-[1200px] 2xl:w-[1400px]"
          >
            <section className="text-secondary-text !leading-7 sm:!leading-8 text-base sm:text-lg text-left sm:text-justify mx-auto w-full md:w-10/12 lg:w-2/3">
        {/* Título principal */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex items-center mb-6"
        >
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">¿Qué es Horycore ERP?</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </motion.div>
        
        {/* Descripción principal */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6"
        >
          <p className="text-lg leading-relaxed">
            Horycore es nuestro sistema ERP diseñado para <span className="text-secondary-color font-semibold">simplificar la gestión de tu negocio</span>. Nuestra plataforma te permite centralizar y automatizar los procesos clave desde un solo lugar, dándote el <span className="text-white font-medium">control total que necesitas</span>.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6"
        >
          <p className="text-lg leading-relaxed">
            En esta etapa inicial, Horycore se enfoca en las <span className="text-secondary-color font-semibold">funcionalidades más importantes</span> para el crecimiento de tu empresa:
          </p>
        </motion.div>
        
        {/* Lista de funcionalidades */}
        <motion.ul 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-4 space-y-3 mb-6"
        >
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-secondary-text">
              <strong className="text-white">Sistema de Ventas y Finanzas:</strong> Administra tus ventas, maneja proveedores y clientes, y lleva un control completo de tu libro de ventas.
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-secondary-text">
              <strong className="text-white">Gestión de Inventarios:</strong> Controla tus productos con el sistema de inventario Kardex, administra tus almacenes y gestiona las sucursales de tu negocio.
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-secondary-text">
              <strong className="text-white">Informes y Análisis:</strong> Obtén una visión clara de tu negocio con reportes detallados y análisis de ventas, lo que te permite tomar decisiones basadas en datos.
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-secondary-text">
              <strong className="text-white">Gestión de Equipos:</strong> Administra a tus empleados y a los usuarios del sistema, asegurando que cada persona tenga el acceso y los permisos correctos.
            </span>
          </li>
        </motion.ul>
        
        {/* Mensaje final */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50"
        >
          <p className="text-lg leading-relaxed text-secondary-text">
            Estamos trabajando constantemente para <span className="text-secondary-color font-semibold">añadir más funcionalidades</span> y potenciar tu negocio. <span className="text-white font-medium">Te invitamos a ser parte de nuestra evolución</span>.
          </p>
        </motion.div>
        
            </section>
          </motion.article>
        </div>
      </div>
    </section>
  );
};

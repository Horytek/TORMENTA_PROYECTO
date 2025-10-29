import React from 'react';
import { motion } from "framer-motion";

export const HistorialVersiones = () => {
  return (
    <section className="w-full pb-8 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1">
      <div className="flex justify-center px-2 sm:px-4">
        <div className="w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
        <motion.div 
          className="flex items-center mb-8"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="w-2 h-8 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-4"></div>
          <h2 className="text-3xl font-bold text-white">Historial de Versiones</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-secondary-color/30 to-transparent ml-6"></div>
        </motion.div>
        
        {/* Versión 2.0 - ACTUAL */}
        <motion.div 
          className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-3xl border border-gray-600/20 transition-all duration-500 overflow-hidden mb-8 hover:border-secondary-color/40"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
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
                    <span className="text-white text-lg font-bold">2.0</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1 transition-colors duration-300">Versión 2.0 - ACTUAL</h3>
                  <p className="text-secondary-color font-semibold">Octubre 2025</p>
                </div>
              </div>
              <span className="bg-secondary-color text-bgDark1 px-4 py-1 rounded-full text-xs font-bold inline-block w-fit">NUEVA</span>
            </div>
            
            <div className="bg-gradient-to-r from-bgDark2/50 to-transparent p-6 rounded-xl border-l-4 border-secondary-color/50 mb-6">
              <p className="text-lg leading-relaxed text-secondary-text">
                La versión más avanzada con <span className="text-secondary-color font-semibold">Chatbot Inteligente con IA</span> integrado para una <span className="text-white font-medium">gestión empresarial asistida</span>.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-secondary-color to-primary-color rounded-full mr-3"></div>
                <h4 className="text-xl font-semibold text-white">Nuevas Funcionalidades con IA</h4>
              </div>
              <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
                <li className="flex items-start">
                  <div className="w-3 h-3 bg-gradient-to-br from-secondary-color to-primary-color rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-secondary-color/50"></div>
                  <span className="text-lg"><strong className="text-white text-xl">Chatbot Inteligente:</strong> <span className="text-secondary-color font-semibold">Asistente virtual con IA avanzada</span> que te ayuda en tiempo real con consultas, navegación y soporte. Disponible en toda la plataforma para facilitar tu trabajo diario.</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Automatización Inteligente:</strong> Procesos automatizados basados en aprendizaje automático</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Análisis de Datos Avanzado:</strong> Reportes inteligentes con insights generados por IA</span>
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
                  <span>Interfaz de usuario renovada y más intuitiva</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Velocidad de respuesta mejorada significativamente</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-secondary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Mayor seguridad y encriptación de datos</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        
        {/* Versión 1.0 - Anterior */}
        <motion.div 
          className="group relative bg-gradient-to-br from-bgDark1 via-bgDark2 to-bgDark1 p-8 rounded-2xl border border-gray-600/20 transition-all duration-500 overflow-hidden mb-8 hover:border-primary-color/40"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-color/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-color/20 to-primary-color/10 rounded-xl border border-primary-color/30 flex items-center justify-center mr-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-color to-primary-color/50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg font-bold">1.0</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 transition-colors duration-300">Versión 1.0</h3>
                  <p className="text-primary-color font-semibold">2024</p>
                </div>
              </div>
              <span className="bg-primary-color text-white px-4 py-1 rounded-full text-xs font-bold inline-block w-fit">ANTERIOR</span>
            </div>

            <div className="bg-gradient-to-l from-bgDark2/30 to-transparent p-6 rounded-xl border-r-4 border-primary-color/40 mb-6">
              <p className="text-lg leading-relaxed text-secondary-text">
                La versión inicial de HoryCore con los <span className="text-primary-color font-semibold">módulos fundamentales</span> para la <span className="text-white font-medium">gestión empresarial completa</span>.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-primary-color to-primary-color/50 rounded-full mr-3"></div>
                <h4 className="text-xl font-semibold text-white">Módulos Incluidos</h4>
              </div>
              <ul className="list-none ml-6 text-secondary-text mt-4 space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Sistema de Ventas:</strong> Gestión completa de ventas y facturación</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Inventario:</strong> Control de stock y almacén en tiempo real</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Compras y Proveedores:</strong> Gestión de compras y relación con proveedores</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Recursos Humanos:</strong> Administración de personal y nóminas</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-primary-color rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span><strong className="text-white">Producción:</strong> Control de procesos productivos y manufactura</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
};

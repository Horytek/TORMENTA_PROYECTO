import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { useLocation, useNavigate } from 'react-router-dom';
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { ConfirmacionModal } from '../../components/landing/ConfirmacionModal';

// Importar estilos específicos
import '../../styles/landing/index.css';

const RegistroLicenciaPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Extraer información del plan desde la query string o estado
  const searchParams = new URLSearchParams(location.search);
  const planName = searchParams.get('plan') || 'Plan Empresarial';
  const planPrice = searchParams.get('price') || 'S/ 30';
  const planPeriod = searchParams.get('period') || 'mes';

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    ruc: '',
    email: '',
    telefono: '',
    certificado: null
  });

  useEffect(() => {
    // Hacer scroll al inicio de la página
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, sube solo archivos PDF');
        return;
      }
      setFormData(prev => ({
        ...prev,
        certificado: file
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío de datos
    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmation(true);
    }, 2500);
  };

  // Datos del plan para el resumen
  const planFeatures = {
    'Plan Básico': [
      'Módulo de ventas',
      'Visualización de reportes básicos',
      'Soporte limitado por correo'
    ],
    'Plan Empresarial': [
      'Módulos: Ventas, Almacén y Compras',
      'Paneles con KPIs y métricas',
      'Soporte técnico en horario comercial'
    ],
    'Plan Corporativo': [
      'Todos los módulos disponibles',
      'Integración con sistemas externos',
      'Soporte premium y onboarding'
    ]
  };

  return (
    <LandingSubPageLayout activeSectorColor="#f59e0b">

      {/* Hero Section */}
      <section className="w-full relative overflow-hidden pt-20">
        <div className="relative z-10 flex justify-center px-2 sm:px-4 py-16">
          <div className="w-full md:w-10/12 lg:w-[1200px] 2xl:w-[1400px]">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="inline-flex items-center bg-gradient-to-r from-secondary-color/20 to-primary-color/20 rounded-full px-6 py-3 mb-8 border border-secondary-color/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="w-2 h-2 bg-secondary-color rounded-full mr-3 animate-pulse"></div>
                <span className="text-secondary-color font-semibold text-sm">Registro de Licencia</span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {planName}{" "}
                <span className="bg-gradient-to-r from-secondary-color to-primary-color bg-clip-text text-transparent">
                  {planPrice}
                </span>
                /{planPeriod}
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-secondary-text max-w-4xl mx-auto mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Completa tu registro para comenzar a transformar tu empresa con{" "}
                <span className="text-white font-semibold">HoryCore ERP</span>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Formulario de Registro */}
      <section className="w-full py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Formulario */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-white/5 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/10"
              >
                <h2 className="text-3xl font-bold text-white mb-2">Información de la Empresa</h2>
                <p className="text-secondary-text mb-8">Complete los datos para crear su cuenta empresarial</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nombre de la Empresa */}
                  <div>
                    <label htmlFor="nombreEmpresa" className="block text-gray-300 font-medium text-sm mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      id="nombreEmpresa"
                      name="nombreEmpresa"
                      value={formData.nombreEmpresa}
                      onChange={handleInputChange}
                      required
                      className="!w-full !display-block px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-400 focus:border-secondary-color focus:shadow-xl focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-all duration-300 !box-border border border-white/10"
                      placeholder="Ingresa el nombre de tu empresa"
                    />
                  </div>

                  {/* RUC */}
                  <div>
                    <label htmlFor="ruc" className="block text-gray-300 font-medium text-sm mb-2">
                      RUC *
                    </label>
                    <input
                      type="text"
                      id="ruc"
                      name="ruc"
                      value={formData.ruc}
                      onChange={handleInputChange}
                      required
                      maxLength="11"
                      pattern="[0-9]{11}"
                      className="!w-full !display-block px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-400 focus:border-secondary-color focus:shadow-xl focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-all duration-300 !box-border border border-white/10"
                      placeholder="20123456789"
                    />
                  </div>

                  {/* Grid de Email y Teléfono */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-gray-300 font-medium text-sm mb-2">
                        Email de Contacto *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="!w-full !display-block px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-400 focus:border-secondary-color focus:shadow-xl focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-all duration-300 !box-border border border-white/10"
                        placeholder="contacto@empresa.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="telefono" className="block text-gray-300 font-medium text-sm mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
                        className="!w-full !display-block px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-400 focus:border-secondary-color focus:shadow-xl focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-all duration-300 !box-border border border-white/10"
                        placeholder="+51 961 797 720"
                      />
                    </div>
                  </div>

                  {/* Subida de Certificado */}
                  <div>
                    <label htmlFor="certificado" className="block text-gray-300 font-medium text-sm mb-4">
                      Certificado Portal SOL (PDF) *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="certificado"
                        name="certificado"
                        accept=".pdf"
                        onChange={handleFileChange}
                        required
                        className="hidden"
                      />
                      <label
                        htmlFor="certificado"
                        className="!w-full !display-block px-4 py-6 bg-white/5 rounded-xl text-white border-2 border-dashed border-gray-500 hover:border-secondary-color focus:border-secondary-color transition-all duration-300 cursor-pointer flex flex-col items-center justify-center !box-border"
                      >
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-gray-400">
                          {formData.certificado ? formData.certificado.name : 'Haz clic para subir tu certificado PDF'}
                        </span>
                      </label>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Sube aquí tu certificado emitido por el portal SOL de SUNAT. Este archivo es necesario para habilitar la licencia.
                    </p>
                  </div>

                  {/* Botón de Envío */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-secondary-color to-primary-color hover:from-primary-color hover:to-secondary-color text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-secondary-color/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creando cuenta...
                        </span>
                      ) : (
                        "Confirmar y Crear Cuenta"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>

            {/* Resumen del Plan */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="bg-white/5 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/10 sticky top-24"
              >
                <h3 className="text-2xl font-bold text-white mb-6">Resumen del Plan</h3>

                <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-white/10">
                  <h4 className="text-xl font-bold text-white mb-2">{planName}</h4>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-bold text-secondary-color">{planPrice}</span>
                    <span className="text-gray-400">/{planPeriod}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h5 className="text-lg font-semibold text-white">Incluye:</h5>
                  {planFeatures[planName]?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-secondary-color mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-primary-color" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-primary-color font-semibold text-sm">Información importante</span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Una vez completado el registro, nuestro equipo se pondrá en contacto contigo dentro de las próximas 24 horas para activar tu licencia y programar la capacitación inicial.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Confirmación */}
      <ConfirmacionModal
        isOpen={showConfirmation}
        setIsOpen={setShowConfirmation}
        planName={planName}
        onClose={() => setShowConfirmation(false)}
      />
    </LandingSubPageLayout>
  );
};

export default RegistroLicenciaPage;
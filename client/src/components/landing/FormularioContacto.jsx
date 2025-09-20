import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const FormularioContacto = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    empresa: "",
    telefono: "",
    tipoConsulta: "",
    mensaje: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Mensaje enviado correctamente. Te contactaremos pronto.");
      setFormData({
        nombre: "",
        email: "",
        empresa: "",
        telefono: "",
        tipoConsulta: "",
        mensaje: ""
      });
    }, 2000);
  };

  const handlePrivacyPolicyClick = () => {
    navigate('/landing/politica-de-privacidad');
  };

  return (
    <section className="w-full py-16 bg-gradient-to-b from-bgDark1 via-bgDark2 to-bgDark1" id="formulario-contacto">
      <div className="flex justify-center px-4">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-bgDark2/80 to-bgDark3/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-700/30"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para Transformar tu Empresa?
              </h2>
              <p className="text-gray-300 text-lg">
                Completa el formulario y nuestro equipo se pondrá en contacto contigo
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nombre" className="block text-gray-300 font-medium text-sm mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="!w-full !display-block px-4 py-3 bg-gradient-to-r from-bgDark3/80 via-bgDark2/60 to-bgDark3/80 rounded-xl text-white placeholder-gray-400 focus:border-secondary-color focus:shadow-xl focus:shadow-secondary-color/30 focus:bg-gradient-to-r focus:from-secondary-color/10 focus:via-bgDark2/80 focus:to-primary-color/10 focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-bgDark2/90 hover:to-bgDark3/90 !box-border"
                    style={{
                      width: '100% !important',
                      display: 'block !important',
                      boxSizing: 'border-box !important',
                      border: '3px solid rgba(107, 114, 128, 0.6) !important',
                      boxShadow: '0 10px 15px -3px rgba(31, 41, 55, 0.3) !important'
                    }}
                    placeholder="Ingresa tu nombre completo"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-gray-300 font-medium text-sm mb-2">
                    Email corporativo *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="!w-full !display-block px-4 py-3 bg-gradient-to-r from-bgDark3/80 via-bgDark2/60 to-bgDark3/80 rounded-xl text-white placeholder-gray-400 focus:border-secondary-color focus:shadow-xl focus:shadow-secondary-color/30 focus:bg-gradient-to-r focus:from-secondary-color/10 focus:via-bgDark2/80 focus:to-primary-color/10 focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-bgDark2/90 hover:to-bgDark3/90 !box-border"
                    style={{
                      width: '100% !important',
                      display: 'block !important',
                      boxSizing: 'border-box !important',
                      border: '3px solid rgba(107, 114, 128, 0.6) !important',
                      boxShadow: '0 10px 15px -3px rgba(31, 41, 55, 0.3) !important'
                    }}
                    placeholder="correo@empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="empresa" className="block text-gray-300 font-medium text-sm mb-2">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    className="!w-full !display-block px-4 py-3 bg-gradient-to-r from-bgDark3/80 via-bgDark2/60 to-bgDark3/80 rounded-xl text-white placeholder-gray-400 focus:border-primary-color focus:shadow-xl focus:shadow-primary-color/30 focus:bg-gradient-to-r focus:from-primary-color/10 focus:via-bgDark2/80 focus:to-secondary-color/10 focus:outline-none focus:ring-2 focus:ring-primary-color/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-bgDark2/90 hover:to-bgDark3/90 !box-border"
                    style={{
                      width: '100% !important',
                      display: 'block !important',
                      boxSizing: 'border-box !important',
                      border: '3px solid rgba(107, 114, 128, 0.6) !important',
                      boxShadow: '0 10px 15px -3px rgba(31, 41, 55, 0.3) !important'
                    }}
                    placeholder="Nombre de tu empresa"
                  />
                </div>
                
                <div>
                  <label htmlFor="telefono" className="block text-gray-300 font-medium text-sm mb-2">
                    Teléfono de contacto
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="!w-full !display-block px-4 py-3 bg-gradient-to-r from-bgDark3/80 via-bgDark2/60 to-bgDark3/80 rounded-xl text-white placeholder-gray-400 focus:border-primary-color focus:shadow-xl focus:shadow-primary-color/30 focus:bg-gradient-to-r focus:from-primary-color/10 focus:via-bgDark2/80 focus:to-secondary-color/10 focus:outline-none focus:ring-2 focus:ring-primary-color/20 transition-all duration-300 hover:bg-gradient-to-r hover:from-bgDark2/90 hover:to-bgDark3/90 !box-border"
                    style={{
                      width: '100% !important',
                      display: 'block !important',
                      boxSizing: 'border-box !important',
                      border: '3px solid rgba(107, 114, 128, 0.6) !important',
                      boxShadow: '0 10px 15px -3px rgba(31, 41, 55, 0.3) !important'
                    }}
                    placeholder="+51 961 797 720"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tipoConsulta" className="block text-gray-300 font-medium text-sm mb-2">
                  Tipo de consulta *
                </label>
                <div className="relative">
                  <select
                    id="tipoConsulta"
                    name="tipoConsulta"
                    value={formData.tipoConsulta}
                    onChange={handleInputChange}
                    required
                    className="!w-full !display-block px-4 py-3 bg-gradient-to-r from-bgDark3/80 via-bgDark2/60 to-bgDark3/80 border-3 border-gray-500/60 shadow-lg shadow-gray-800/30 rounded-xl text-white focus:border-secondary-color focus:shadow-xl focus:shadow-secondary-color/30 focus:bg-gradient-to-r focus:from-secondary-color/10 focus:via-bgDark2/80 focus:to-primary-color/10 focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-all duration-300 hover:border-secondary-color/70 hover:shadow-lg hover:shadow-gray-700/40 hover:bg-gradient-to-r hover:from-bgDark2/90 hover:to-bgDark3/90 appearance-none cursor-pointer !box-border"
                  >
                    <option value="" className="bg-bgDark3 text-gray-400">Selecciona el tipo de consulta</option>
                    <option value="implementacion" className="bg-bgDark3 text-white">Implementación completa</option>
                    <option value="migracion" className="bg-bgDark3 text-white">Migración de sistema actual</option>
                    <option value="consultoria" className="bg-bgDark3 text-white">Consultoría y asesoría</option>
                    <option value="soporte" className="bg-bgDark3 text-white">Soporte técnico</option>
                    <option value="personalizacion" className="bg-bgDark3 text-white">Personalización de módulos</option>
                    <option value="capacitacion" className="bg-bgDark3 text-white">Capacitación del equipo</option>
                    <option value="demo" className="bg-bgDark3 text-white">Demo del sistema</option>
                  </select>
                  
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <label htmlFor="mensaje" className="block text-gray-300 font-medium text-sm mb-2">
                  Describe tu proyecto *
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="!w-full !max-w-none !display-block px-6 py-4 bg-gradient-to-br from-bgDark3/80 via-bgDark2/60 via-bgDark3/70 to-bgDark2/80 rounded-xl text-white placeholder-gray-400 focus:border-secondary-color focus:shadow-xl focus:shadow-secondary-color/30 focus:bg-gradient-to-br focus:from-secondary-color/10 focus:via-bgDark2/80 focus:via-bgDark3/90 focus:to-primary-color/10 focus:outline-none focus:ring-2 focus:ring-secondary-color/20 transition-all duration-300 hover:bg-gradient-to-br hover:from-bgDark2/90 hover:via-bgDark3/95 hover:to-bgDark2/90 resize-vertical min-h-[100px] text-base leading-relaxed !box-border"
                  style={{
                    width: '100% !important',
                    display: 'block !important',
                    boxSizing: 'border-box !important',
                    border: '3px solid rgba(107, 114, 128, 0.6) !important',
                    boxShadow: '0 10px 15px -3px rgba(31, 41, 55, 0.3) !important'
                  }}
                  placeholder="Cuéntanos detalladamente sobre tu empresa, necesidades específicas, número de usuarios, procesos actuales que necesitas automatizar con Horycore..."
                />
              </div>

              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-secondary-color to-primary-color hover:from-primary-color hover:to-secondary-color text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-secondary-color/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando consulta...
                    </span>
                  ) : (
                    "Enviar consulta"
                  )}
                </button>
              </div>

              <div className="text-center text-sm text-gray-400 pt-2">
                Al enviar este formulario, aceptas nuestra{" "}
                <button
                  type="button"
                  onClick={handlePrivacyPolicyClick}
                  className="text-secondary-color hover:text-primary-color transition-colors duration-200"
                >
                  Política de Privacidad
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
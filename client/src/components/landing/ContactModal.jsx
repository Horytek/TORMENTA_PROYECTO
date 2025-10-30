import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

/**
 * Modal reutilizable para solicitudes y consultas
 * Mantiene el diseño minimalista y la paleta de colores de la landing
 * @param {boolean} isOpen - Estado del modal
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} title - Título personalizable del modal
 * @param {string} type - Tipo de consulta (demo, contact, support, etc.)
 */
export const ContactModal = ({ 
  isOpen, 
  onClose, 
  title = "Solicitar Demo - HoryCore", 
  type = "demo" 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    message: '',
    tipo: type
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll sin usar position fixed
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      return () => {
        // Restaurar scroll al cerrar
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      console.log('Enviando datos:', formData);
      
      // Enviar datos al backend
      const response = await axios.post('/api/landing/contact', formData);
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        setSubmitStatus('success');
        // Limpiar formulario
        setFormData({
          email: '',
          message: '',
          tipo: type
        });
        
        // Cerrar modal después de 5 segundos
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error al enviar consulta:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Crear el contenido del modal
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999]"
          onClick={handleBackdropClick}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl shadow-2xl"
            style={{
              backgroundColor: 'rgba(48, 49, 54, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              maxHeight: 'calc(100vh - 2rem)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decoración superior con gradiente */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 z-10"
              style={{
                background: 'linear-gradient(90deg, rgb(161, 163, 247) 0%, rgb(99, 102, 241) 100%)'
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                aria-label="Cerrar modal"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="px-6 pb-6 overflow-y-auto" style={{ flex: '1 1 auto' }}>
              {submitStatus === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                  >
                    <svg 
                      className="w-8 h-8 text-green-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    ¡Enviado con éxito!
                  </h3>
                  <p className="text-gray-400 text-center">
                    Nos pondremos en contacto contigo pronto.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-gray-300 text-sm mb-6">
                    Déjanos tu correo y cuéntanos en qué podemos ayudarte.
                  </p>

                  {/* Email Input */}
                  <div>
                    <label 
                      htmlFor="email" 
                      className="contact-modal-label"
                    >
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="tu@email.com"
                      className="contact-modal-input"
                    />
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <label 
                      htmlFor="message" 
                      className="contact-modal-label"
                    >
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Cuéntanos qué necesitas..."
                      className="contact-modal-textarea"
                    />
                  </div>

                  {/* Error Message */}
                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg flex items-center gap-2"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    >
                      <svg 
                        className="w-5 h-5 text-red-400 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <p className="text-sm text-red-300">
                        Hubo un error al enviar. Por favor, intenta nuevamente.
                      </p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'rgb(99, 102, 241)',
                      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <svg 
                          className="animate-spin h-5 w-5" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          />
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                          />
                        </svg>
                        Enviar solicitud
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Renderizar el modal en un portal para evitar problemas de posicionamiento
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

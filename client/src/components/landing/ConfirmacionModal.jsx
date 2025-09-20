import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const ConfirmacionModal = ({ isOpen, setIsOpen, planName, onClose }) => {
  const navigate = useNavigate();

  const handleGoToLanding = () => {
    setIsOpen(false);
    navigate('/landing');
  };

  const handleContactSupport = () => {
    setIsOpen(false);
    // Redirigir a WhatsApp de Javier Rojas
    window.open('https://wa.me/51961797720?text=Hola, acabo de registrar mi cuenta para ' + planName + ' y me gustaría información sobre la activación de mi licencia.', '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-gradient-to-br from-bgDark2/95 to-bgDark3/95 backdrop-blur-md rounded-3xl p-8 mx-4 max-w-md w-full shadow-2xl border border-gray-700/30"
            initial={{ scale: 0.7, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          >
            {/* Icono de éxito */}
            <div className="flex justify-center mb-6">
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", duration: 0.6 }}
              >
                <motion.svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>
            </div>

            {/* Título */}
            <motion.h2
              className="text-2xl font-bold text-white text-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              ¡Cuenta Creada Exitosamente!
            </motion.h2>

            {/* Mensaje */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <p className="text-gray-300 mb-4 leading-relaxed">
                Tu cuenta para el <span className="text-secondary-color font-semibold">{planName}</span> ha sido creada correctamente.
              </p>
              <div className="bg-gradient-to-r from-secondary-color/10 to-primary-color/10 rounded-xl p-4 border border-secondary-color/20">
                <p className="text-sm text-gray-400">
                  <span className="text-primary-color font-semibold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    Próximo paso:
                  </span> Nuestro equipo te contactará dentro de las próximas 24 horas para activar tu licencia y programar la capacitación inicial.
                </p>
              </div>
            </motion.div>

            {/* Botones */}
            <motion.div
              className="flex flex-col space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {/* Botón principal */}
              <button
                onClick={handleContactSupport}
                className="w-full bg-gradient-to-r from-secondary-color to-primary-color hover:from-primary-color hover:to-secondary-color text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-secondary-color/25 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Contactar Soporte Ahora
              </button>

              {/* Botón secundario */}
              <button
                onClick={handleGoToLanding}
                className="w-full bg-gradient-to-r from-bgDark3/80 to-bgDark2/80 hover:from-bgDark2/90 hover:to-bgDark3/90 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-gray-600/30 hover:border-gray-500/50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Volver al Inicio
              </button>
            </motion.div>

            {/* Botón de cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { useLocation, useNavigate } from 'react-router-dom';
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { ConfirmacionModal } from '../../components/landing/ConfirmacionModal';
import { RegistroForm } from '../../components/landing/RegistroForm';

// Importar estilos específicos
import '../../styles/landing/index.css';
import { getPlanPrice } from '../../config/plans.config';

const RegistroLicenciaPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Extraer información del plan desde la query string o estado
  // Extraer información del plan desde la query string o estado
  const searchParams = new URLSearchParams(location.search);
  const planName = searchParams.get('plan') || 'Emprendedor';
  const planPeriod = searchParams.get('period') || 'mes';

  // Calcular precio basado en el plan y periodo
  const priceInfo = getPlanPrice(planName, planPeriod);
  const planPrice = priceInfo.formattedPrice;



  useEffect(() => {
    // Hacer scroll al inicio de la página
    window.scrollTo(0, 0);
  }, []);

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
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Completa tu Registro Corporativo</h2>
          {/* Using the ERP Form Component */}
          <RegistroForm planInfo={{
            plan: planName,
            price: planPrice,
            period: planPeriod,
            features: priceInfo.features,
            priceValue: priceInfo.price,
            currency: priceInfo.currency
          }} />
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
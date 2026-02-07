import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Importar componentes de landing
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { RegistroPocketForm } from '../../components/landing/RegistroPocketForm';

// Importar configuración de planes
import { getPlanPrice, isValidPlan, isValidPeriod, getDefaultPlanInfo } from '../../config/plans.config';

// Importar estilos específicos de landing aislados
import '../../styles/landing/index.css';

export default function RegistroPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [planInfo, setPlanInfo] = useState({
    plan: '',
    price: '',
    period: ''
  });

  // Extraer información del plan de la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let planName = searchParams.get('plan') || '';
    let period = searchParams.get('period') || '';

    // Validar plan y período
    const isPlanValid = isValidPlan(planName);
    const isPeriodValid = isValidPeriod(period);

    // Si alguno es inválido, redirigir con valores por defecto
    if (!isPlanValid || !isPeriodValid) {
      const defaults = getDefaultPlanInfo();
      const newSearchParams = new URLSearchParams({
        plan: defaults.plan,
        period: defaults.period
      });

      // Redirigir a la URL correcta
      navigate(`/landing/registro?${newSearchParams.toString()}`, { replace: true });
      return;
    }

    // Obtener el precio de forma segura desde la configuración
    const priceInfo = getPlanPrice(planName, period);

    setPlanInfo({
      plan: planName,
      price: priceInfo.formattedPrice,
      period: period,
      priceValue: priceInfo.price, // Precio numérico para cálculos
      currency: priceInfo.currency,
      features: priceInfo.features
    });
  }, [location.search, navigate]);

  return (
    <LandingSubPageLayout activeSectorColor="#10b981">
      <section className="py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 relative z-10">
          <div className="w-full md:w-10/12 lg:w-[1200px] mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-white mb-4 mt-8 md:mt-10 lg:mt-12">
              Crea tu cuenta
            </h1>
            <p className="text-lg text-gray-400 text-center mb-8">
              Comienza con el plan <span className="text-emerald-400 font-semibold">{planInfo.plan}</span> • {planInfo.price}/{planInfo.period}
            </p>

            <RegistroPocketForm planInfo={planInfo} />
          </div>
        </div>
      </section>
    </LandingSubPageLayout>
  );
}
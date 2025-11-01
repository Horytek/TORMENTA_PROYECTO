import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Importar componentes de landing
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';
import { RegistroForm } from '../../components/landing/RegistroForm';
import { MetaballsOriginal } from '../../components/landing/MetaballsOriginal';

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

  // Extraer información del plan de la URL o sessionStorage
  useEffect(() => {
    // Primero intentar obtener datos desde sessionStorage
    const storedPlanData = sessionStorage.getItem('selectedPlan');
    let planName = '';
    let period = '';
    
    if (storedPlanData) {
      try {
        const parsed = JSON.parse(storedPlanData);
        // Validar que los datos no sean muy antiguos (menos de 1 hora)
        const isRecent = parsed.timestamp && (Date.now() - parsed.timestamp < 3600000);
        
        if (isRecent && parsed.plan && parsed.period) {
          planName = parsed.plan;
          period = parsed.period;
          
          // Limpiar los datos después de usarlos (seguridad adicional)
          sessionStorage.removeItem('selectedPlan');
        }
      } catch (error) {
        console.error('Error al leer datos del plan:', error);
      }
    }
    
    // Si no hay datos en sessionStorage, intentar desde URL (fallback)
    if (!planName || !period) {
      const searchParams = new URLSearchParams(location.search);
      planName = searchParams.get('plan') || '';
      period = searchParams.get('period') || '';
    }
    
    // Validar plan y período
    const isPlanValid = isValidPlan(planName);
    const isPeriodValid = isValidPeriod(period);
    
    // Si alguno es inválido, redirigir con valores por defecto
    if (!isPlanValid || !isPeriodValid) {
      const defaults = getDefaultPlanInfo();
      
      // Guardar en sessionStorage y redirigir sin parámetros
      sessionStorage.setItem('selectedPlan', JSON.stringify({
        plan: defaults.plan,
        period: defaults.period,
        timestamp: Date.now()
      }));
      
      // Redirigir a la URL sin parámetros
      navigate('/landing/registro', { replace: true });
      return;
    }
    
    // Obtener el precio de forma segura desde la configuración
    const priceInfo = getPlanPrice(planName, period);
    
    setPlanInfo({
      plan: planName,
      price: priceInfo.formattedPrice,
      period: period,
      priceValue: priceInfo.price, // Precio numérico para cálculos
      currency: priceInfo.currency
    });
  }, [location.search, navigate]);

  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="registro">
      {/* Fondo animado */}
      <MetaballsOriginal />
      
      {/* Contenido de la página de registro */}
      <div className="relative z-10">
        <Navbar />
        
        <section className="py-16 md:py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="w-full md:w-10/12 lg:w-[1200px] mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-primary-text mb-6 mt-8 md:mt-10 lg:mt-12">
                Registro para {planInfo.plan}
              </h1>
              <p className="text-lg text-secondary-text text-center mb-12">
                Complete el formulario a continuación para comenzar su suscripción al {planInfo.plan}
              </p>

              <RegistroForm planInfo={planInfo} />
            </div>
          </div>
        </section>
        
        <Footer />
        <ScrollUpButton />
      </div>
    </div>
  );
}
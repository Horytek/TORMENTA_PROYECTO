import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Importar componentes de landing
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';
import { RegistroForm } from '../../components/landing/RegistroForm';
import { MetaballsOriginal } from '../../components/landing/MetaballsOriginal';

// Importar estilos específicos de landing aislados
import '../../styles/landing/index.css';

export default function RegistroPage() {
  const location = useLocation();
  const [planInfo, setPlanInfo] = useState({
    plan: '',
    price: '',
    period: ''
  });

  // Extraer información del plan de la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setPlanInfo({
      plan: searchParams.get('plan') || 'Plan Básico',
      price: searchParams.get('price') || 'S/ 0',
      period: searchParams.get('period') || 'mes'
    });
  }, [location.search]);

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
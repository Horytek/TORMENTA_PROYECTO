import React, { useEffect } from 'react';

// Importa los componentes de la landing migrados
import { Navbar } from '../../components/landing/Navbar';
import { Hero } from '../../components/landing/Hero';
import { Features1 } from '../../components/landing/Features1';
import { Features2 } from '../../components/landing/Features2';
import { FeaturesDiagonal } from '../../components/landing/FeaturesDiagonal';
import { Pricing } from '../../components/landing/Pricing';
import { Brands } from '../../components/landing/Brands';
import { Testimonials } from '../../components/landing/Testimonials';
import { Blog } from '../../components/landing/Blog';
import { FAQ } from '../../components/landing/FAQ';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Importar estilos específicos de landing aislados
import '../../styles/landing/index.css';

export default function LandingPage() {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="landing">
      <Navbar />
      <Hero />
      <Features1 />
      <Features2 />
      <FeaturesDiagonal />
      <Pricing />
      <Brands />
      <Testimonials />
      <Blog />
      <FAQ />
      <Footer />
      <ScrollUpButton />
    </div>
  );
}
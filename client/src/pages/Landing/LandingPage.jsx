import React, { useEffect } from 'react';

// Importa los componentes de la landing
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import Features1 from '../../components/Features1';
import Features2 from '../../components/Features2';
import FeaturesDiagonal from '../../components/FeaturesDiagonal';
import Pricing from '../../components/Pricing';
import Brands from '../../components/Brands';
import Testimonials from '../../components/Testimonials';
import Blog from '../../components/Blog';
import FAQ from '../../components/FAQ';
import Footer from '../../components/Footer';
import ScrollUpButton from '../../components/ScrollUpButton';

import './landing.css';

export default function LandingPage() {
  // Añade/remueve una clase al body para aislar estilos si lo deseas
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-root">
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
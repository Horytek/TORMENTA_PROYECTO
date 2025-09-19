import React, { useEffect } from 'react';

// Importa los componentes migrados
import { Navbar } from '../../components/landing/Navbar';
import { PrivacyHero } from '../../components/landing/PrivacyHero';
import { PrivacyContent } from '../../components/landing/PrivacyContent';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Importar estilos específicos
import '../../styles/landing/index.css';

const PoliticaPrivacidadPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="privacidad">
      <Navbar />
      <PrivacyHero />
      <PrivacyContent />
      <Footer />
      <ScrollUpButton />
    </div>
  );
};

export default PoliticaPrivacidadPage;

import React from 'react';

// Importa los componentes migrados
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { PrivacyHero } from '../../components/landing/PrivacyHero';
import { PrivacyContent } from '../../components/landing/PrivacyContent';

// Importar estilos específicos
import '../../styles/landing/index.css';

const PoliticaPrivacidadPage = () => {
  return (
    <LandingSubPageLayout activeSectorColor="#64748b">
      <PrivacyHero />
      <PrivacyContent />
    </LandingSubPageLayout>
  );
};

export default PoliticaPrivacidadPage;

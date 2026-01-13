import React from 'react';

// Importa los componentes migrados
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { TerminosHeader } from '../../components/landing/TerminosHeader';
import { TerminosResponsabilidad } from '../../components/landing/TerminosResponsabilidad';

import '../../styles/landing/index.css';

const TerminosCondicionesPage = () => {
  return (
    <LandingSubPageLayout activeSectorColor="#64748b">
      <TerminosHeader />
      <TerminosResponsabilidad />
    </LandingSubPageLayout>
  );
};

export default TerminosCondicionesPage;

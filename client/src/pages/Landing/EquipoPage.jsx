import React from 'react';

// Importa los componentes migrados
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { TeamHero } from '../../components/landing/TeamHero';
import { TeamMembers } from '../../components/landing/TeamMembers';

// Importar estilos específicos
import '../../styles/landing/index.css';

const EquipoPage = () => {
  return (
    <LandingSubPageLayout activeSectorColor="#f59e0b">
      <TeamHero />
      <TeamMembers />
    </LandingSubPageLayout>
  );
};

export default EquipoPage;

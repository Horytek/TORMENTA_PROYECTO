import React from 'react';

// Importa los componentes migrados
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { ActualizacionesHero } from '../../components/landing/ActualizacionesHero';
import { ActualizacionesContent } from '../../components/landing/ActualizacionesContent';
import { HistorialVersiones } from '../../components/landing/HistorialVersiones';
import { EstadisticasAdopcion } from '../../components/landing/EstadisticasAdopcion';
import { ProximasActualizaciones } from '../../components/landing/ProximasActualizaciones';
import { CanalActualizaciones } from '../../components/landing/CanalActualizaciones';

// Importar estilos específicos
import '../../styles/landing/index.css';

const ActualizacionesPage = () => {
  return (
    <LandingSubPageLayout activeSectorColor="#3b82f6">
      <ActualizacionesHero />
      <ActualizacionesContent />
      <HistorialVersiones />
      <EstadisticasAdopcion />
      <ProximasActualizaciones />
      <CanalActualizaciones />
    </LandingSubPageLayout>
  );
};

export default ActualizacionesPage;

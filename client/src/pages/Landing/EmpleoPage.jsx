import React, { useState } from 'react';

// Importa los componentes migrados
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { JobsHero } from '../../components/landing/JobsHero';
import { PosicionesDisponibles } from '../../components/landing/PosicionesDisponibles';
import { ProximasOportunidades } from '../../components/landing/ProximasOportunidades';
import { ContactModal } from '../../components/landing/ContactModal';

// Importar estilos específicos
import '../../styles/landing/index.css';

const EmpleosPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <LandingSubPageLayout activeSectorColor="#10b981">
      <JobsHero />
      <PosicionesDisponibles />
      <ProximasOportunidades onOpenModal={openModal} />

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Solicitud Empleo"
        type="contact"
      />
    </LandingSubPageLayout>
  );
};

export default EmpleosPage;

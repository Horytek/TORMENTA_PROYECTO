import React, { useState } from 'react';

// Importa los componentes migrados
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { AboutHero } from '../../components/landing/AboutHero';
import { NuestraEmpresa } from '../../components/landing/NuestraEmpresa';
import { QueEsHorycore } from '../../components/landing/QueEsHorycore';
import { NuestrosValores } from '../../components/landing/NuestrosValores';
import { PorQueElegir } from '../../components/landing/PorQueElegir';
import { TransformacionDigital } from '../../components/landing/TransformacionDigital';
import { ContactModal } from '../../components/landing/ContactModal';

// Importar estilos específicos
import '../../styles/landing/index.css';

const SobreNosotrosPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <LandingSubPageLayout activeSectorColor="#10b981">
      <AboutHero />
      <NuestraEmpresa />
      <QueEsHorycore />
      <NuestrosValores />
      <PorQueElegir />
      <TransformacionDigital onOpenModal={() => setIsModalOpen(true)} />

      {/* Modal de contacto */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Solicitar Demo - HoryCore"
        type="demo"
      />
    </LandingSubPageLayout>
  );
};

export default SobreNosotrosPage;

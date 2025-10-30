import React, { useEffect, useState } from 'react';

// Importa los componentes migrados
import { Navbar } from '../../components/landing/Navbar';
import { JobsHero } from '../../components/landing/JobsHero';
import { PosicionesDisponibles } from '../../components/landing/PosicionesDisponibles';
import { ProximasOportunidades } from '../../components/landing/ProximasOportunidades';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';
import { ContactModal } from '../../components/landing/ContactModal';

// Importar estilos específicos
import '../../styles/landing/index.css';

const EmpleosPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="landing-page" data-theme="empleos">
      <Navbar />
      <JobsHero />
      <PosicionesDisponibles />
      <ProximasOportunidades onOpenModal={openModal} />
      <Footer />
      <ScrollUpButton />
      
      <ContactModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Solicitud Empleo"
        type="contact"
      />
    </div>
  );
};

export default EmpleosPage;

import React, { useEffect } from 'react';

// Importa los componentes migrados
import { Navbar } from '../../components/landing/Navbar';
import { JobsHero } from '../../components/landing/JobsHero';
import { PosicionesDisponibles } from '../../components/landing/PosicionesDisponibles';
import { ProximasOportunidades } from '../../components/landing/ProximasOportunidades';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Importar estilos específicos
import '../../styles/landing/index.css';

const EmpleosPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="empleos">
      <Navbar />
      <JobsHero />
      <PosicionesDisponibles />
      <ProximasOportunidades />
      <Footer />
      <ScrollUpButton />
    </div>
  );
};

export default EmpleosPage;

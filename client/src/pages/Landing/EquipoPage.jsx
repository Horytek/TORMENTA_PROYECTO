import React, { useEffect } from 'react';

// Importa los componentes migrados
import { Navbar } from '../../components/landing/Navbar';
import { TeamHero } from '../../components/landing/TeamHero';
import { TeamMembers } from '../../components/landing/TeamMembers';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Importar estilos específicos
import '../../styles/landing/index.css';

const EquipoPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="equipo">
      <Navbar />
      <TeamHero />
      <TeamMembers />
      <Footer />
      <ScrollUpButton />
    </div>
  );
};

export default EquipoPage;

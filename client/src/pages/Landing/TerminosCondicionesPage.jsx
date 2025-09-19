import React, { useEffect } from 'react';

// Importa los componentes migrados
import { Navbar } from '../../components/landing/Navbar';
import { TerminosHeader } from '../../components/landing/TerminosHeader';
import { TerminosResponsabilidad } from '../../components/landing/TerminosResponsabilidad';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

import '../../styles/landing/index.css';

const TerminosCondicionesPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="terminos">
      <Navbar />
      <TerminosHeader />
      <TerminosResponsabilidad />
      <Footer />
      <ScrollUpButton />
    </div>
  );
};

export default TerminosCondicionesPage;

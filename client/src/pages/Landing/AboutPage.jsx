import React, { useEffect } from 'react';

// Importa los componentes migrados
import { Navbar } from '../../components/landing/Navbar';
import { AboutHero } from '../../components/landing/AboutHero';
import { NuestraEmpresa } from '../../components/landing/NuestraEmpresa';
import { QueEsHorycore } from '../../components/landing/QueEsHorycore';
import { NuestrosValores } from '../../components/landing/NuestrosValores';
import { PorQueElegir } from '../../components/landing/PorQueElegir';
import { TransformacionDigital } from '../../components/landing/TransformacionDigital';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Importar estilos específicos
import '../../styles/landing/index.css';

const SobreNosotrosPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="sobre-nosotros">
      <Navbar />
      <AboutHero />
      <NuestraEmpresa />
      <QueEsHorycore />
      <NuestrosValores />
      <PorQueElegir />
      <TransformacionDigital />
      <Footer />
      <ScrollUpButton />
    </div>
  );
};

export default SobreNosotrosPage;

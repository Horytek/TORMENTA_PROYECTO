import React, { useEffect } from 'react';

// Importa los componentes migrados
import { Navbar } from '../../components/landing/Navbar';
import { ActualizacionesHero } from '../../components/landing/ActualizacionesHero';
import { ActualizacionesContent } from '../../components/landing/ActualizacionesContent';
import { HistorialVersiones } from '../../components/landing/HistorialVersiones';
import { EstadisticasAdopcion } from '../../components/landing/EstadisticasAdopcion';
import { ProximasActualizaciones } from '../../components/landing/ProximasActualizaciones';
import { CanalActualizaciones } from '../../components/landing/CanalActualizaciones';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Importar estilos específicos
import '../../styles/landing/index.css';

const ActualizacionesPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="actualizaciones">
      <Navbar />
      <ActualizacionesHero />
      <ActualizacionesContent />
      <HistorialVersiones />
      <EstadisticasAdopcion />
      <ProximasActualizaciones />
      <CanalActualizaciones />
      <Footer />
      <ScrollUpButton />
    </div>
  );
};

export default ActualizacionesPage;

import React, { useEffect } from 'react';
// Importar estilos específicos de landing
import '../../styles/landing/index.css';


// Importa los componentes migrados
import { Navbar } from '../../components/landing/Navbar';
import { ContactoHero } from '../../components/landing/ContactoHero';
import { FormularioContacto } from '../../components/landing/FormularioContacto';
import { InformacionContacto } from '../../components/landing/InformacionContacto';
import { UbicacionOficinas } from '../../components/landing/UbicacionOficinas';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

const ContactoPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  return (
    <div className="landing-page" data-theme="contacto">
      <Navbar />
      <ContactoHero />
      <FormularioContacto />
      <InformacionContacto />
      <UbicacionOficinas />
      <Footer />
      <ScrollUpButton />
    </div>
  );
};

export default ContactoPage;

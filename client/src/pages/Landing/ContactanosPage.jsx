import React from 'react';
// Importar estilos específicos de landing
import '../../styles/landing/index.css';


// Importa los componentes migrados
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { ContactoHero } from '../../components/landing/ContactoHero';
import { FormularioContacto } from '../../components/landing/FormularioContacto';
import { InformacionContacto } from '../../components/landing/InformacionContacto';

const ContactoPage = () => {
  return (
    <LandingSubPageLayout activeSectorColor="#3b82f6">
      <ContactoHero />
      <FormularioContacto />
      <InformacionContacto />
    </LandingSubPageLayout>
  );
};

export default ContactoPage;

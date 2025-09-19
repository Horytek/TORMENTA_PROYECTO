import React, { useEffect } from 'react';

// Importa los componentes de servicios migrados
import { Navbar } from '../../components/landing/Navbar';
import { ServiciosHero } from '../../components/landing/ServiciosHero';
import { ModulosPrincipales } from '../../components/landing/ModulosPrincipales';
import { BeneficiosClave } from '../../components/landing/BeneficiosClave';
import { ServiciosAdicionales } from '../../components/landing/ServiciosAdicionales';
import { ContactoServicios } from '../../components/landing/ContactoServicios';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';

// Importar estilos específicos de servicios aislados
import '../../styles/landing/index.css';

const ServiciosPage = () => {
  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);


  return (
    <div className="landing-page " data-theme="servicios">
      {/* Navegación */}
      <Navbar />
      
      {/* Hero de servicios */}
      <ServiciosHero />
      
      {/* Módulos principales del ERP */}
      <ModulosPrincipales />
      
      {/* Beneficios clave */}
      <BeneficiosClave />
      
      {/* Servicios adicionales */}
      <ServiciosAdicionales />
      
      {/* Contacto para servicios */}
      <ContactoServicios />
      
      {/* Footer */}
      <Footer />
      
      {/* Botón de scroll */}
      <ScrollUpButton />
    </div>
  );
};

export default ServiciosPage;
import React, { useEffect, useState } from 'react';

// Importa los componentes de servicios migrados
import { Navbar } from '../../components/landing/Navbar';
import { ServiciosHero } from '../../components/landing/ServiciosHero';
import { ModulosPrincipales } from '../../components/landing/ModulosPrincipales';
import { BeneficiosClave } from '../../components/landing/BeneficiosClave';
import { ServiciosAdicionales } from '../../components/landing/ServiciosAdicionales';
import { ContactoServicios } from '../../components/landing/ContactoServicios';
import { Footer } from '../../components/landing/Footer';
import { ScrollUpButton } from '../../components/landing/ScrollUpButton';
import { ContactModal } from '../../components/landing/ContactModal';

// Importar estilos específicos de servicios aislados
import '../../styles/landing/index.css';

const ServiciosPage = () => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    type: 'demo'
  });

  // Añade/remueve una clase al body para aislar estilos
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  const openModal = (title, type) => {
    setModalConfig({ isOpen: true, title, type });
  };

  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };


  return (
    <div className="landing-page " data-theme="servicios">
      {/* Navegación */}
      <Navbar />
      
      {/* Hero de servicios */}
      <ServiciosHero />
      
      {/* Módulos principales del ERP */}
      <ModulosPrincipales onOpenModal={() => openModal('Solicitar Demostración', 'demo')} />
      
      {/* Beneficios clave */}
      <BeneficiosClave onOpenModal={() => openModal('Solicitar Demo - HoryCore', 'demo')} />
      
      {/* Servicios adicionales */}
      <ServiciosAdicionales onOpenModal={() => openModal('Solicitar Cotización', 'contact')} />
      
      {/* Contacto para servicios */}
      <ContactoServicios onOpenModal={() => openModal('Solicitar Demo - HoryCore', 'demo')} />
      
      {/* Footer */}
      <Footer />
      
      {/* Botón de scroll */}
      <ScrollUpButton />

      {/* Modal de contacto */}
      <ContactModal 
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        type={modalConfig.type}
      />
    </div>
  );
};

export default ServiciosPage;
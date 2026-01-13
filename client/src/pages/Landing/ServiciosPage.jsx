import React, { useState } from 'react';

// Importa los componentes de servicios migrados
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { ServiciosHero } from '../../components/landing/ServiciosHero';
import { ModulosPrincipales } from '../../components/landing/ModulosPrincipales';
import { BeneficiosClave } from '../../components/landing/BeneficiosClave';
import { ServiciosAdicionales } from '../../components/landing/ServiciosAdicionales';
import { SectoresAtendemos } from '../../components/landing/SectoresAtendemos';
import { ContactoServicios } from '../../components/landing/ContactoServicios';
import { ContactModal } from '../../components/landing/ContactModal';

// Styles
import '../../styles/landing/index.css';

const ServiciosPage = () => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    type: 'demo'
  });

  const openModal = (title, type) => {
    setModalConfig({ isOpen: true, title, type });
  };

  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };


  return (
    <LandingSubPageLayout activeSectorColor="#a855f7">

      {/* 1. Hero: Propuesta de Valor Principal */}
      <ServiciosHero />

      {/* 2. Core: Módulos Reales (6 Cards - Ventas, Inv, Clientes, etc.) */}
      <ModulosPrincipales onOpenModal={() => openModal('Solicitar Demostración', 'demo')} />

      {/* 3. Beneficios Clave: Re-integrado (Glass Grid) */}
      <BeneficiosClave />

      {/* 4. Servicios Adicionales (Image 1 Style - Implementation/Integrations) */}
      <ServiciosAdicionales />

      {/* 5. Sectores (Image 2 Style - Grid of Industries) */}
      <SectoresAtendemos onOpenModal={(t) => openModal(t, 'contact')} />

      {/* 6. Contact (Image 3 Style) */}
      <ContactoServicios onOpenModal={(t, type) => openModal(t, type)} />

      {/* Modal de contacto compartido */}
      <ContactModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        type={modalConfig.type}
      />
    </LandingSubPageLayout>
  );
};

export default ServiciosPage;
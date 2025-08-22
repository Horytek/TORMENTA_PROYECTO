import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useNegocio } from './ComponentsNegocio/useNegocio';
import PageHeader from './ComponentsNegocio/PageHeader';
import LoadingSpinner from './ComponentsNegocio/LoadingSpinner';
import BusinessInfoForm from './ComponentsNegocio/BusinessInfoForm';
import FormActions from './ComponentsNegocio/FormActions';
import LogoUploader from './ComponentsNegocio/LogoUploader';

export default function Negocio() {
  const {
    nombre,
    setNombre,
    direccion,
    setDireccion,
    logo,
    preview,
    loading,
    saving,
    handleLogoChange,
    resetChanges,
    removeLogo,
    hasChanges,
    handleSubmit
  } = useNegocio();

  return (
    <div className="m-4">
      <Toaster />
      <PageHeader />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-3 space-y-6">
            <BusinessInfoForm
              nombre={nombre}
              setNombre={setNombre}
              direccion={direccion}
              setDireccion={setDireccion}
            />

           
          </div>

          {/* Columna lateral: Logo */}
          <div className="space-y-4 ">
            <LogoUploader
              preview={preview}
              logo={logo}
              handleLogoChange={handleLogoChange}
              removeLogo={removeLogo}
            />
             <FormActions
              hasChanges={hasChanges}
              saving={saving}
              resetChanges={resetChanges}
              onSubmit={handleSubmit}
            />  
          </div>
        </form>
      )}
    </div>
  );
}

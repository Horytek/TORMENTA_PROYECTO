import React, { useState } from 'react';
import { useNegocio } from './ComponentsNegocio/useNegocio';
import PageHeader from './ComponentsNegocio/PageHeader';
import LoadingSpinner from './ComponentsNegocio/LoadingSpinner';
import BusinessInfoForm from './ComponentsNegocio/BusinessInfoForm';
import { Card, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { LogotipoPopoverInfo } from "@/components/common/LogotipoPopoverInfo";
import { UploadCloud, Undo, Save, Eye } from 'lucide-react';
import { exportVoucherToPdf } from '@/utils/pdf/voucherToPdf';
import { motion } from "framer-motion";

export default function Negocio() {
  const {
    nombre,
    setNombre,
    ruc,
    setRuc,
    direccion,
    setDireccion,
    logotipoUrl,
    setLogotipoUrl,
    onLogotipoUrlChange,
    handleLogoChange, // Added for file upload
    preview,
    loading,
    saving,
    resetChanges,
    hasChanges,
    handleSubmit,
    // New fields
    distrito, setDistrito,
    provincia, setProvincia,
    departamento, setDepartamento,
    codigoPostal, setCodigoPostal,
    email, setEmail,
    telefono, setTelefono,
    moneda, setMoneda,
    pais, setPais
  } = useNegocio();

  // Modal Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const handlePreviewPdf = async () => {
    // 1. Prepare Logo
    let logoBase64 = null;
    if (preview) {
      try {
        const res = await fetch(preview);
        const blob = await res.blob();
        const reader = new FileReader();
        logoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Error fetching logo for preview", e);
      }
    }

    // 2. Generate Content String (Simple Template)
    const content = `
${(nombre || "NOMBRE NEGOCIO").toUpperCase()}
${(direccion || "DIRECCION").toUpperCase()}
${(distrito || "").toUpperCase()} - ${(provincia || "").toUpperCase()} - ${(departamento || "").toUpperCase()}
RUC: ${(ruc || "00000000000")}
----------------------------------------
       BOLETA DE VENTA ELECTRONICA
             B001-000001
----------------------------------------
FECHA: ${new Date().toLocaleDateString()}  HORA: ${new Date().toLocaleTimeString()}
CLIENTE: CLIENTE DE PRUEBA
DNI/RUC: 00000000
DIRECCION: -
----------------------------------------
DESCRIPCION          CANT   P.UNIT   TOTAL
----------------------------------------
PRODUCTO DE PRUEBA     1   100.00   100.00
----------------------------------------
SUBTOTAL:                           100.00
IGV (18%):                           18.00
TOTAL A PAGAR: ${moneda}            118.00
----------------------------------------
      GRACIAS POR SU PREFERENCIA
    Representación impresa de la
     Boleta de Venta Electrónica
`;

    // 3. Generate PDF Blob URL
    // We expect exportVoucherToPdf to return a blob url string if returnBlobUrl: true
    const url = exportVoucherToPdf(content, {
      logo: logoBase64,
      returnBlobUrl: true
    });

    setPdfBlobUrl(url);
    setIsPreviewOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="m-4 md:m-6 space-y-6 max-w-[1600px] mx-auto"
    >
      <PageHeader title="Configuración del negocio" subtitle="Actualiza los datos visibles en tus comprobantes, documentos y panel." />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Columna principal: Información General */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-zinc-800">
              Información General
            </h3>
            <BusinessInfoForm
              nombre={nombre}
              setNombre={setNombre}
              ruc={ruc}
              setRuc={setRuc}
              direccion={direccion}
              setDireccion={setDireccion}
              // New Props
              distrito={distrito} setDistrito={setDistrito}
              provincia={provincia} setProvincia={setProvincia}
              departamento={departamento} setDepartamento={setDepartamento}
              codigoPostal={codigoPostal} setCodigoPostal={setCodigoPostal}
              email={email} setEmail={setEmail}
              telefono={telefono} setTelefono={setTelefono}
              moneda={moneda} setMoneda={setMoneda}
              pais={pais} setPais={setPais}
            />
          </div>

          {/* Columna lateral: Previsualización */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl p-6 h-fit">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Previsualización</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Así se verá el logo en tus comprobantes.
              </p>
            </div>

            {/* Logo Box */}
            <div className="border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl h-48 flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 mb-4 overflow-hidden relative group transition-colors hover:border-blue-400">
              {preview ? (
                <img src={preview} alt="Logo Preview" className="max-w-[80%] max-h-[80%] object-contain" />
              ) : (
                <div className="text-center text-slate-400">
                  <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <span className="text-xs font-medium">Sin logotipo</span>
                </div>
              )}
            </div>

            {/* Visual Actions */}
            <div className="space-y-3">
              {/* File Upload Button */}
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleLogoChange}
              />
              <Button
                size="sm"
                variant="flat"
                color="primary"
                className="w-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold"
                startContent={<UploadCloud size={16} />}
                onPress={() => document.getElementById('logo-upload').click()}
              >
                {preview ? "Cambiar imagen" : "Subir imagen"}
              </Button>

              <Button
                size="sm"
                className="w-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300 font-bold"
                variant="light"
                startContent={<Eye size={16} />}
                onPress={handlePreviewPdf}
              >
                Previsualizar PDF
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-3">
              <Button
                color="primary"
                className="w-full font-bold shadow-lg shadow-blue-500/20"
                startContent={<Save size={18} />}
                type="submit"
                isLoading={saving}
                isDisabled={!hasChanges}
              >
                Guardar cambios
              </Button>
              <Button
                variant="light"
                color="danger"
                startContent={<Undo size={18} />}
                onPress={resetChanges}
                className="w-full font-medium"
              >
                Revertir cambios
              </Button>
            </div>

          </div>
        </form>
      )}

      {/* Modal de Previsualización */}
      <Modal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        size="2xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Previsualización del Comprobante
                <span className="text-xs font-normal text-slate-400">Verifica cómo se verá tu logo en los documentos emitidos.</span>
              </ModalHeader>
              <ModalBody className="p-0 h-[85vh] bg-slate-100 dark:bg-zinc-900/50">
                {pdfBlobUrl ? (
                  <iframe
                    src={pdfBlobUrl}
                    className="w-full h-full border-0"
                    title="Voucher Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                <Button color="primary" onPress={onClose}>
                  Entendido
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </motion.div>
  );
}

import React, { useState } from 'react';
import { Tooltip } from '@heroui/react';
import { FaTrashAlt, FaUpload } from 'react-icons/fa';
import { ActionButton } from "@/components/Buttons/Buttons";
import ReceiptPreviewModal from './ReceiptPreviewModal';

export default function LogoUploader({ 
  preview, 
  logo, 
  handleLogoChange, 
  removeLogo,
  nombre,
  direccion 
}) {
  const [openPreview, setOpenPreview] = useState(false);
  return (
    <div className="bg-white dark:bg-[#18192b] rounded-xl shadow-sm border border-blue-50/60 dark:border-zinc-700/60 hover:border-blue-200 dark:hover:border-blue-400 transition-colors p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Previsualización de los comprobantes</h2>
          <p className="text-md text-blue-600/70 dark:text-blue-300/70 mt-1">Customiza los comprobantes con el logo de tu negocio</p>
        </div>
        {preview && (
          <Tooltip content="Eliminar logo" color="danger" offset={6}>
            <ActionButton
              color="red"
              icon={<FaTrashAlt className="text-[15px]" />}
              size="sm"
              isIconOnly
              onClick={removeLogo}
              className="border-0 shadow-none bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-200"
              style={{ boxShadow: "none", border: "none" }}
            />
          </Tooltip>
        )}
      </div>

      <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50/40 to-white dark:from-blue-900/20 dark:to-zinc-900/80">
        {preview ? (
          <img
            src={preview}
            alt="Logo preview"
            className="max-h-40 object-contain drop-shadow-sm transition-all"
          />
        ) : (
          <div className="text-blue-700/60 dark:text-blue-200/60 text-sm font-medium py-6">Sin logo</div>
        )}
        <label className="mt-4 inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200/80 dark:hover:bg-blue-900/50 px-4 py-2 rounded-full transition">
          <FaUpload className="text-blue-700 dark:text-blue-200" />
          <span>{preview ? 'Cambiar logo' : 'Subir logo'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
        </label>
        {logo && (
          <p className="mt-2 text-[11px] text-blue-600/70 dark:text-blue-300/70">{logo.name} ({(logo.size/1024).toFixed(1)} KB)</p>
        )}

        <ActionButton
          color="blue"
          icon={null}
          onClick={() => setOpenPreview(true)}
          size="md"
          className="mt-4 w-full justify-center h-11 px-4 font-semibold rounded-xl border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200"
          style={{ boxShadow: "none", border: "none" }}
        >
          Previsualizar comprobante
        </ActionButton>
      </div>
      <ReceiptPreviewModal
        isOpen={openPreview}
        onClose={() => setOpenPreview(false)}
        logoUrl={preview || null}
        nombre={nombre}
        direccion={direccion}
      />
    </div>
  );
}
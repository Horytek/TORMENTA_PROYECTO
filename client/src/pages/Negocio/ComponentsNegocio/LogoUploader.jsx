import React from 'react';
import { Button, Tooltip } from '@heroui/react';
import { FaTrashAlt, FaUpload } from 'react-icons/fa';

export default function LogoUploader({ 
  preview, 
  logo, 
  handleLogoChange, 
  removeLogo 
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-50/60 hover:border-blue-200 transition-colors p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-blue-900">Identidad visual</h2>
          <p className="text-xs text-blue-600/70 mt-1">PNG o JPG, fondo transparente recomendado. Máx 2MB.</p>
        </div>
        {preview && (
          <Tooltip content="Eliminar logo" color="danger" offset={6}>
            <Button
              size="sm"
              color="danger"
              variant="light"
              isIconOnly
              onClick={removeLogo}
            >
              <FaTrashAlt className="text-[15px]" />
            </Button>
          </Tooltip>
        )}
      </div>

      <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50/40 to-white">
        {preview ? (
          <img
            src={preview}
            alt="Logo preview"
            className="max-h-40 object-contain drop-shadow-sm transition-all"
          />
        ) : (
          <div className="text-blue-700/60 text-sm font-medium py-6">Sin logo</div>
        )}
        <label className="mt-4 inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200/80 px-4 py-2 rounded-full transition">
          <FaUpload className="text-blue-700" />
          <span>{preview ? 'Cambiar logo' : 'Subir logo'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
        </label>
        {logo && (
          <p className="mt-2 text-[11px] text-blue-600/70">{logo.name} ({(logo.size/1024).toFixed(1)} KB)</p>
        )}
      </div>
    </div>
  );
}

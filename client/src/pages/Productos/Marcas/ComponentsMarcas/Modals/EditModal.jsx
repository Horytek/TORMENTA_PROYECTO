import React, { useState } from "react";
import PropTypes from "prop-types";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import "./EditModal.css";

// Componentes UI de Registro_Venta adaptados para el modal
const Label = ({ children, htmlFor, className = "" }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-bold ${className}`}>
    {children}
  </label>
);

const Input = ({ id, value, onChange, placeholder, className = "" }) => (
  <input
    id={id}
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full p-2 text-sm bg-gray-50 text-gray-900 rounded-lg border ${className}`}
  />
);

// RegistroVentaModal como un formulario dentro de un modal
const RegistroVentaModal = ({ onClose }) => {
  const [brandName, setBrandName] = useState("");

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Editar Marca</h3>
        </div>
        <div className="modal-body">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2 align-left">
              <Label htmlFor="brand-name">
                Nombre de la Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brand-name"
                placeholder="Ingresa el nombre"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-buttons mt-4 flex justify-end space-x-2">
            <ButtonClose onClick={onClose} />
            <ButtonSave />
          </div>
        </div>
      </div>
    </div>
  );
};

RegistroVentaModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default RegistroVentaModal;

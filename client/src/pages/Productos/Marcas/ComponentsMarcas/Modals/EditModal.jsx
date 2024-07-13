import React, { useState } from "react";
import PropTypes from "prop-types";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import "./EditModal.css";

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

const Select = ({ id, value, onChange, options, className = "" }) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className={`w-full p-2 text-sm bg-gray-50 text-gray-900 rounded-lg border ${className}`}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value} style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
        {option.label}
      </option>
    ))}
  </select>
);

const RegistroVentaModal = ({ onClose }) => {
  const [brandName, setBrandName] = useState("");
  const [brandStatus, setBrandStatus] = useState("Activo");

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="content-modal">
          <div className="modal-header">
            <h3 className="modal-title">Editar Marca</h3>
          </div>
          <div className="modal-body">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="brand-name">Nombre de la Marca <span className="text-red-500">*</span></Label>
                <Input
                  id="brand-name"
                  placeholder="Ingresa el nombre"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="brand-status">Estado de la Marca</Label>
                <Select
                  id="brand-status"
                  value={brandStatus}
                  onChange={(e) => setBrandStatus(e.target.value)}
                  options={[
                    { value: 'Activo', label: 'Activo' },
                    { value: 'Inactivo', label: 'Inactivo' }
                  ]}
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
    </div>
  );
};

RegistroVentaModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default RegistroVentaModal;

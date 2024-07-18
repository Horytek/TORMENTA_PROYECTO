import { useState } from "react";
import PropTypes from "prop-types";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import "./RegistroModal.css";

// Componentes UI de Registro_Venta adaptados para el modal
const Label = ({ children, htmlFor, className = "" }) => (
  <label htmlFor={htmlFor} className={`rvm-block rvm-text-sm rvm-font-bold ${className}`}>
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
    className={`rvm-w-full rvm-p-2 rvm-text-sm rvm-bg-gray-50 rvm-text-gray-900 rvm-rounded-lg rvm-border ${className}`}
  />
);

// RegistroVentaModal como un formulario dentro de un modal
const RegistroVentaModal = ({ modalTitle, onClose }) => {
  const [brandName, setBrandName] = useState("");

  return (
    <div className="rvm-modal-overlay">
      <div className="rvm-modal">
        <div className="rvm-content-modal">
          <div className="rvm-modal-header">
            <h3 className="rvm-modal-title">{modalTitle}</h3>
          </div>
          <div className="rvm-modal-body">
            <div className="rvm-space-y-4">
              <div className="rvm-flex rvm-flex-col rvm-space-y-2 rvm-align-left">
                <Label htmlFor="brand-name">
                  Nombre de la Marca <span className="rvm-text-red-500">*</span>
                </Label>
                <Input
                  id="brand-name"
                  placeholder="Ingresa el nombre"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="rv-modal-input"

                />
              </div>
            </div>
            <div className="rvm-modal-buttons rvm-mt-4 rvm-flex rvm-justify-end rvm-space-x-2">
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
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RegistroVentaModal;

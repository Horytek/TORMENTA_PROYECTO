import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import "./EditModal.css";

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`rv-modal-block rv-modal-text-sm rv-modal-font-bold ${className}`}
  >
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
    className={`rv-modal-w-full rv-modal-p-2 rv-modal-text-sm rv-modal-bg-gray-50 rv-modal-text-gray-900 rv-modal-rounded-lg rv-modal-border ${className}`}
  />
);

const Select = ({ id, value, onChange, options, className = "" }) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className={`rv-modal-w-full rv-modal-p-2 rv-modal-text-sm rv-modal-bg-gray-50 rv-modal-text-gray-900 rv-modal-rounded-lg rv-modal-border ${className}`}
  >
    {options.map((option) => (
      <option
        key={option.value}
        value={option.value}
        style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
      >
        {option.label}
      </option>
    ))}
  </select>
);

const EditModal = ({ onClose, onSubmit, initialName, initialStatus }) => {
  const [nombreMarca, setNombreMarca] = useState(initialName || "");
  const [estadoMarca, setEstadoMarca] = useState(initialStatus || "Activo");

  useEffect(() => {
    setNombreMarca(initialName);
    setEstadoMarca(initialStatus);
  }, [initialName, initialStatus]);

  return (
    <div className="rv-modal-overlay">
      <div className="rv-modal">
        <div className="rv-modal-content">
          <div className="rv-modal-header">
            <h3 className="rv-modal-title">Editar Marca</h3>
          </div>
          <div className="rv-modal-body">
            <div className="rv-modal-space-y-4">
              <div className="rv-modal-flex rv-modal-flex-col rv-modal-space-y-2">
                <Label htmlFor="brand-name" className="rv-modal-label">
                  Nombre de la Marca <span className="rv-modal-text-red-500">*</span>
                </Label>
                <Input
                  id="brand-name"
                  placeholder="Ingresa el nombre"
                  value={nombreMarca}
                  onChange={(e) => setNombreMarca(e.target.value)}
                  className="rv-modal-input"
                />
              </div>
              <div className="rv-modal-flex rv-modal-flex-col rv-modal-space-y-2">
                <Label htmlFor="brand-status" className="rv-modal-label">
                  Estado de la Marca
                </Label>
                <Select
                  id="brand-status"
                  value={estadoMarca}
                  onChange={(e) => setEstadoMarca(e.target.value)}
                  options={[
                    { value: "Activo", label: "Activo" },
                    { value: "Inactivo", label: "Inactivo" },
                  ]}
                  className="rv-modal-select"
                />
              </div>
            </div>

            <div className="modal-buttons mt-4 flex justify-end space-x-2">
              <ButtonClose onClick={onClose} />
              <ButtonSave onClick={() => onSubmit(nombreMarca, estadoMarca)}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

EditModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialName: PropTypes.string,
  initialStatus: PropTypes.string,
};

export default EditModal;

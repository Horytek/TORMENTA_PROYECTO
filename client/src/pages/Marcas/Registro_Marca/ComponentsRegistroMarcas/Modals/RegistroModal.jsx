import React, { useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import "./RegistroModal.css";

// Componentes UI adaptados para el modal
const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`rvm-block rvm-text-sm rvm-font-bold ${className}`}
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
    className={`rvm-w-full rvm-p-2 rvm-text-sm rvm-bg-gray-50 rvm-text-gray-900 rvm-rounded-lg rvm-border ${className}`}
  />
);

// RegistroModal como un formulario dentro de un modal
const RegistroModal = ({ onClose, onSubmit }) => {
  const [nombreMarca, setNombreMarca] = useState("");

  const handleLocalSubmit = () => {
    const marcaData = {
      nom_marca: nombreMarca,
      estado_marca: 1,
    };
    axios
      .post("http://localhost:4000/api/marcas", marcaData)
      .then((response) => {
        console.log("Marca agregada con éxito:", response.data);
        onSubmit(); 
        onClose(); 
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error al agregar la marca:", error);
      });
  };

  return (
    <div className="rvm-modal-overlay">
      <div className="rvm-modal">
        <div className="rvm-content-modal">
          <div className="rvm-modal-header">
            <h4 className="rvm-modal-title" style={{ marginBottom: "10px" }}>
              Agregar Marca
            </h4>
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
                  value={nombreMarca}
                  onChange={(e) => setNombreMarca(e.target.value)}
                  className="rv-modal-input"
                />
              </div>
            </div>
            <div className="rvm-modal-buttons rvm-mt-4 rvm-flex rvm-justify-end rvm-space-x-2">
              <ButtonClose onClick={onClose} />
              <ButtonSave onClick={handleLocalSubmit} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

RegistroModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default RegistroModal;

// src/components/AddProviderModal.js
import React from 'react';
import './AgregarProovedor.css';

const AgregarProovedor = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Agregar proveedor</h2>
          <button className="close-button" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          <form>
            <div className="form-group">
              <label htmlFor="ruc-dni">RUC/DNI:</label>
              <input type="text" id="ruc-dni" disabled value="12345678" />
              <button className="sunat-button">SUNAT</button>
            </div>
            <div className="form-group">
              <label htmlFor="provider">Proveedor:</label>
              <input type="text" id="provider" disabled value="Jorge Saldarriaga Vignolo" />
            </div>
            <div className="form-group">
              <label htmlFor="address">Dirección:</label>
              <input type="text" id="address" disabled value="Los amautas" />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Teléfono:</label>
              <input type="text" id="phone" disabled value="123 456 789" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" disabled value="elsensualcandunga@gmail.com" />
            </div>
            <div className="form-group">
              <label htmlFor="web">Web:</label>
              <input type="text" id="web" disabled value="123 456 789" />
            </div>
            <div className="form-group">
              <label htmlFor="status">Estado:</label>
              <select id="status">
                <option value="activo">Activo (Default)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cat-sunat">Cat. Sunat:</label>
              <select id="cat-sunat">
                <option value="">Seleccione</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="observation">Observación:</label>
              <textarea id="observation" placeholder="Input text"></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="status-sunat">Status Sunat:</label>
              <div id="status-sunat" className="status-sunat"></div>
            </div>
            <div className="modal-footer">
              <button type="button" className="save-button">Guardar</button>
              <button type="button" className="close-button" onClick={onClose}>Cerrar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgregarProovedor;

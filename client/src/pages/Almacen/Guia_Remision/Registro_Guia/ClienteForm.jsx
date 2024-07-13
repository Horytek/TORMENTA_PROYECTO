import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import './ModalGuias.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

function ClienteForm({ modalTitle, onClose }) {
  const [tab, setTab] = useState('registro'); // State to manage tabs

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className='content-modal'>
          <div className="modal-header">
            <h3 className="modal-title">{modalTitle}</h3>
            <button className="modal-close" onClick={onClose}>
              <IoMdClose className='text-3xl'/>
            </button>
          </div>
          <div className='modal-body'>
            <div className="tabs">
              <button className={tab === 'registro' ? 'active' : ''} onClick={() => setTab('registro')}>Registro</button>
              <button className={tab === 'otros' ? 'active' : ''} onClick={() => setTab('otros')}>Otros datos</button>
            </div>
            {tab === 'registro' && (
              <div className='modal-content'>
                <label>RUC/DNI:</label>
                <input type="text" placeholder="12345678" />
                <label>Nombre:</label>
                <input type="text" placeholder="Jorge Saldarriaga Vignolo" />
                <label>Rz. Comercial:</label>
                <input type="text" />
                <label>Teléfono:</label>
                <input type="text" />
                <label>Pers. Contacto:</label>
                <input type="text" />
                <label>Dirección:</label>
                <input type="text" />
                <label>Email:</label>
                <input type="email" />
                <label>Cat. Sunat:</label>
                <select>
                  <option>Seleccione</option>
                </select>
                <label>Status Sunat:</label>
                <select>
                  <option>Seleccione</option>
                </select>
              </div>
            )}
            {tab === 'otros' && (
              <div className='modal-content'>
                <label>Categoria:</label>
                <select>
                  <option>Seleccione</option>
                </select>
                <label>Vendedor:</label>
                <select>
                  <option>Seleccione</option>
                </select>
              </div>
            )}
          </div>
          <div className='modal-buttons'>
            <ButtonClose onClick={onClose}/>
            <ButtonSave/>
          </div>
        </div>
      </div>
    </div>
  );
}

ClienteForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ClienteForm;

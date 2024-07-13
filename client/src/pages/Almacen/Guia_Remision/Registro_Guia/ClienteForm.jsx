import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import './ModalGuias.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

function ClienteForm({ modalTitle, onClose }) {
  const [tab, setTab] = useState('registro');

  return (
    <div className="modal3-overlay">
      <div className="modal3">
        <div className='content-modal3'>
          <div className="modal3-header">
            <h2 className="modal3-title">{modalTitle}</h2>
            <button className="close-button" onClick={onClose}>
              <IoMdClose className='text-3xl'/>
            </button>
          </div>
          <div className="modal-bodywa">
            <div className="tabs">
              <button 
                className={`p-4 ${tab === 'registro' ? 'active' : ''}`}
                onClick={() => setTab('registro')}
              >
                Registro
              </button>
              <button 
                className={`p-4 ${tab === 'otros' ? 'active' : ''}`}
                onClick={() => setTab('otros')}
              >
                Otros datos
              </button>
            </div>
            <form>
              {tab === 'registro' && (
                <div className='modal2-content'>
                  <div className="form-row">
                    <div className="form-group">
                      <label className='text-sm font-bold text-black' htmlFor="ruc-dni">RUC/DNI:</label>
                      <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5 wider2-input' type="text" id="ruc-dni" />
                    </div>
                    <div className="items-center justify-center pt-5">
                      <button className="sunat-button rounded-lg border p-2.5">SUNAT</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="nombre">Nombre:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="nombre" />
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="rz-comercial">Rz. Comercial:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="rz-comercial" />
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="telefono">Teléfono:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="telefono" />
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="contacto">Pers. Contacto:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="contacto" />
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="direccion">Dirección:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="direccion" />
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="email">Email:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="email" id="email" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className='text-sm font-bold text-black' htmlFor="cat-sunat">Cat. Sunat:</label>
                      <select id="cat-sunat" className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'>
                        <option>Seleccione</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className='text-sm font-bold text-black' htmlFor="status-sunat">Status Sunat:</label>
                      <select id="status-sunat" className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'>
                        <option>Seleccione</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'otros' && (
                <div className='modal2-content'>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="categoria">Categoria:</label>
                    <select id="categoria" className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'>
                      <option>Seleccione</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="vendedor">Vendedor:</label>
                    <select id="vendedor" className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'>
                      <option>Seleccione</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="modal-buttons">
                <ButtonClose onClick={onClose} />
                <ButtonSave />
              </div>
            </form>
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

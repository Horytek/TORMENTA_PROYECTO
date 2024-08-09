import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import './ModalGuias.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

function ClienteForm({ modalTitle, onClose }) {
  const [tab, setTab] = useState('registro');
  const [isActive, setIsActive] = useState(false); // Agregado para manejar el estado del checkbox

  const handleCheckboxChange = () => {
    setIsActive(prevState => !prevState);
  };

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
            <div className="tabs flex justify-center mt-2">
              <div className='w-full'>
                <button 
                  className={`p-4 ${tab === 'registro' ? 'active' : ''} w-full`}
                  onClick={() => setTab('registro')}
                >
                  Persona Natural
                </button>
              </div>
              <div className='w-full'>
                <button 
                  className={`p-4 ${tab === 'otros' ? 'active' : ''} w-full`}
                  onClick={() => setTab('otros')}
                >
                  Persona Jurídica
                </button>
              </div>
            </div>
            <form>
              {tab === 'registro' && (
                <div className='modal2-content'>
                  <div className="form-row">
                    <div className="form-group">
                      <label className='text-sm font-bold text-black' htmlFor="dni">DNI:</label>
                      <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5 wider2-input' type="text" id="ruc-dni" />
                    </div>
                    <div className="items-center justify-center pt-5">
                      <button className="sunat-button rounded-lg border p-2.5">SUNAT</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="nombres">Nombres:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="nombre" />
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="apellidos">Apellidos:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="nombre" />
                  </div>
                  <div className="w-full text-start mb-5">
                  <label className='text-sm font-bold text-black' htmlFor="direccion">Dirección:</label>
                    <div className="flex items-center">
                      <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="direccion" />
                      <div className="ml-4 flex items-center">
                      <input
                        type="checkbox"
                        id="activo"
                        checked={isActive}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <label htmlFor="activo" className="text-sm font-bold text-black">Activo</label>
                    </div>
                    </div>
                    
                  </div>
                </div>
              )}
              {tab === 'otros' && (
                <div className='modal2-content'>
                  <div className="form-row">
                    <div className="form-group">
                      <label className='text-sm font-bold text-black' htmlFor="ruc">RUC:</label>
                      <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5 wider2-input' type="text" id="ruc-dni" />
                    </div>
                    <div className="items-center justify-center pt-5">
                      <button className="sunat-button rounded-lg border p-2.5">SUNAT</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="razonsocial">Razón Social:</label>
                    <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="razonsocial" />
                  </div>
                  <div className="w-full text-start mb-5">
                  <label className='text-sm font-bold text-black' htmlFor="direccion">Dirección:</label>
                    <div className="flex items-center">
                      <input className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' type="text" id="direccion" />
                      <div className="ml-4 flex items-center">
                      <input
                        type="checkbox"
                        id="activo"
                        checked={isActive}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      <label htmlFor="activo" className="text-sm font-bold text-black">Activo</label>
                    </div>
                    </div>
                    
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

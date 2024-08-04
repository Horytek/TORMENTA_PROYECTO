import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import './ModalGuias.css';

import { ModalTransporte } from './ModalGuias/ModalTransporte';
import { ModalTransportista } from './ModalGuias/ModalTransportista';

const TransporteForm = ({ modalTitle, onClose }) => {
  const [transportePublico, setTransportePublico] = useState(true);
  const [isModalOpenTransporte, setIsModalOpenTransporte] = useState(false);
  const [isModalOpenTransportista, setIsModalOpenTransportista] = useState(false);


  // Logica Modal Transporte
  const openModalTransporte = () => {
    setIsModalOpenTransporte(true);
  };
  const closeModalTransporte = () => {
    setIsModalOpenTransporte(false);
  };

  // Logica Modal Transportista
  const openModalTransportista = () => {
    setIsModalOpenTransportista(true);
  };
  const closeModalTransportista = () => {
    setIsModalOpenTransportista(false);
  };

  const handleTransporteToggle = (value) => {
    setTransportePublico(value);
  };

  return (
    <div className="modal1-overlay">
      <div className="modal1">
        <div className='content-modal1'>
          <div className="modal-header">
            <h3 className="modal-title">{modalTitle}</h3>
            <button className="modal-close" onClick={onClose}>
              <IoMdClose className='text-3xl'/>
            </button>
          </div>
          <div className='modal-body'>
            {/* Transporte Público */}
            <div className='datos-transporte'>
              <div className='header'>
                <div className='toggle'>
                  <input 
                    type="radio" 
                    checked={transportePublico} 
                    onChange={() => handleTransporteToggle(true)} 
                  />
                  <label>Transporte Público</label>
                </div>
                <button className='nuevo-transporte' onClick={openModalTransportista} >
                  <FaPlus />N. Transporte
                </button>
              </div>
              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor="ruc">RUC:</label>
                  <input type="text" id="ruc"  disabled={!transportePublico} />
                </div>
                <div className='form-group mt-7'>
                  <label htmlFor="m1l">
                    <input type="checkbox" id="m1l" disabled={!transportePublico} />
                    <span>Traslado en vehículos de categoría M1 o L</span>
                  </label>
                </div>
                <div className='form-group'>
                  <label htmlFor="empresa">Empresa:</label>
                  <input type="text" id="empresa" disabled={!transportePublico} />
                </div>
                <div className='form-group'>
                  <label htmlFor="placa">Placa:</label>
                  <input type="text" id="placa" disabled={!transportePublico} />
                </div>
              </div>
            </div>

            {/* Transporte Privado */}
            <div className='datos-transporte'>
              <div className='header'>
                <div className='toggle'>
                  <input 
                    type="radio" 
                    checked={!transportePublico} 
                    onChange={() => handleTransporteToggle(false)} 
                  />
                  <label>Transporte Privado</label>
                </div>
                <button className='nuevo-transportista'  onClick={openModalTransporte}>
                  <FaPlus/>N. Transporte
                </button>
              </div>
              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor="nombre-conductor">Nomb. Conductor:</label>
                  <input type="text" id="nombre-conductor" disabled={transportePublico} />
                </div>
                <div className='form-group'>
                  <label htmlFor="brevete">Brevete:</label>
                  <input type="text" id="brevete" disabled={transportePublico} />
                </div>
                <div className='form-group'>
                  <label htmlFor="apellidos-conductor">Apellidos Conductor:</label>
                  <input type="text" id="apellidos-conductor" disabled={transportePublico} />
                </div>
                <div className='form-group'>
                  <label htmlFor="placa-privada">Placa:</label>
                  <input type="text" id="placa-privada" disabled={transportePublico} />
                </div>
                <div className='form-group'>
                  <label htmlFor="marca">Marca:</label>
                  <input type="text" id="marca" disabled={transportePublico} />
                </div>
                <div className='form-group'>
                  <label htmlFor="inscripcion">Inscripción:</label>
                  <input type="text" id="inscripcion" disabled={transportePublico} />
                </div>
                <div className='form-group'>
                  <label htmlFor="carreta">Carreta:</label>
                  <input type="text" id="carreta" disabled={transportePublico} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de Nuevo Transportista */}
      {isModalOpenTransportista && (
        <ModalTransportista modalTitle={'Registrar Transportista'} closeModel={closeModalTransportista} />
      )}

      {/* Modal de Nuevo Transporte */}
      {isModalOpenTransporte && (
        <ModalTransporte modalTitle={'Registrar Unidad de Transporte'} closeModel={closeModalTransporte} />
      )}
    </div>
  );
};

TransporteForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TransporteForm;

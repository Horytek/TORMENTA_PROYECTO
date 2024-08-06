import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import './ModalGuias.css';

import { ModalTransporte } from './ModalGuias/ModalTransporte';
import { ModalTransportista } from './ModalGuias/ModalTransportista';

import useTransPubData from '../../data/data_transpub';

const TransporteForm = ({ modalTitle, onClose }) => {
  const [transportePublico, setTransportePublico] = useState(true);
  const [isModalOpenTransporte, setIsModalOpenTransporte] = useState(false);
  const [isModalOpenTransportista, setIsModalOpenTransportista] = useState(false);
  const { transpublicos } = useTransPubData();
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [ruc, setRuc] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefonopub, setTelef] = useState('');

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
    if (!value) {
      setSelectedEmpresa('');
      setRuc('');
      setPlaca('');
      setTelef('');
    }
  };

  const handleEmpresaChange = (e) => {
    const empresa = e.target.value;
    setSelectedEmpresa(empresa);

    const selectedTrans = transpublicos.find(trans => trans.razonsocial === empresa);
    if (selectedTrans) {
      setRuc(selectedTrans.ruc);
      setPlaca(selectedTrans.placa);
      setTelef(selectedTrans.telefonopub);
    } else {
      setRuc('');
      setPlaca('');
      setTelef('');
    }
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
                  <label htmlFor="empresa">Empresa:</label>
                  <select 
                    id="empresa" 
                    value={selectedEmpresa} 
                    onChange={handleEmpresaChange} 
                    disabled={!transportePublico} 
                    className={!transportePublico ? 'bg-gray-300' : ''}
                  >
                    <option value="">Seleccione una Empresa</option>
                    {transpublicos.map(trans => (
                      <option key={trans.id} value={trans.razonsocial}>{trans.razonsocial}</option>
                    ))}
                  </select>
                </div>
                <div className='form-group'>
                  <label htmlFor="telefonopub">Telefono:</label>
                  <input 
                    type="text" 
                    id="telefonopub" 
                    value={telefonopub} 
                    disabled 
                    className="form-input disabled:bg-gray-300" 
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor="ruc">RUC:</label>
                  <input 
                    type="text" 
                    id="ruc" 
                    value={ruc} 
                    disabled 
                    className="form-input disabled:bg-gray-300" 
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor="placa">Placa:</label>
                  <input 
                    type="text" 
                    id="placa" 
                    value={placa} 
                    disabled 
                    className="form-input disabled:bg-gray-300" 
                  />
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
                  <input type="text" id="nombre-conductor" disabled={transportePublico} className={transportePublico ? 'bg-gray-300' : ''}/>
                </div>
                <div className='form-group'>
                  <label htmlFor="brevete">Brevete:</label>
                  <input type="text" id="brevete" disabled={transportePublico} className={transportePublico ? 'bg-gray-300' : ''}/>
                </div>
                <div className='form-group'>
                  <label htmlFor="apellidos-conductor">Apellidos Conductor:</label>
                  <input type="text" id="apellidos-conductor" disabled={transportePublico} className={transportePublico ? 'bg-gray-300' : ''}/>
                </div>
                <div className='form-group'>
                  <label htmlFor="placa-privada">Placa:</label>
                  <input type="text" id="placa-privada" disabled={transportePublico} className={transportePublico ? 'bg-gray-300' : ''}/>
                </div>
                <div className='form-group'>
                  <label htmlFor="marca">Marca:</label>
                  <input type="text" id="marca" disabled={transportePublico} className={transportePublico ? 'bg-gray-300' : ''}/>
                </div>
                <div className='form-group'>
                  <label htmlFor="inscripcion">Inscripción:</label>
                  <input type="text" id="inscripcion" disabled={transportePublico} className={transportePublico ? 'bg-gray-300' : ''}/>
                </div>
                <div className='form-group'>
                  <label htmlFor="carreta">Carreta:</label>
                  <input type="text" id="carreta" disabled={transportePublico} className={transportePublico ? 'bg-gray-300' : ''}/>
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

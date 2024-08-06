import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import './ModalGuias.css';

import { ModalTransporte } from './ModalGuias/ModalTransporte';
import { ModalTransportista } from './ModalGuias/ModalTransportista';

import useTransPubData from '../../data/data_transpub';
import useTransPrivData from '../../data/data_transpriv';

const TransporteForm = ({ modalTitle, onClose }) => {
  const [transportePublico, setTransportePublico] = useState(true);
  const [isModalOpenTransporte, setIsModalOpenTransporte] = useState(false);
  const [isModalOpenTransportista, setIsModalOpenTransportista] = useState(false);

  //TRANSPORTE PUBLICO
  const { transpublicos } = useTransPubData();
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [ruc, setRuc] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefonopub, setTelefPub] = useState('');
  const [vehiculopub, setVehiculoPub] = useState('');

  //TRANSPORTE PRIVADO
  const { transprivados } = useTransPrivData();
  const [selectedConductor, setSelectedConductor] = useState('');
  const [dni, setDni] = useState('');
  const [placapriv, setPlacaPriv] = useState('');
  const [telefonopriv, setTelefPriv] = useState('');
  const [vehiculopriv, setVehiculoPriv] = useState('');

  // Lógica Modal Transporte
  const openModalTransporte = () => {
    setIsModalOpenTransporte(true);
  };

  const closeModalTransporte = () => {
    setIsModalOpenTransporte(false);
  };

  // Lógica Modal Transportista
  const openModalTransportista = () => {
    setIsModalOpenTransportista(true);
  };

  const closeModalTransportista = () => {
    setIsModalOpenTransportista(false);
  };

  const handleTransporteToggle = (value) => {
    setTransportePublico(value);
    if (value) {
      // Limpiar los campos de transporte privado
      setSelectedConductor('');
      setDni('');
      setPlacaPriv('');
      setTelefPriv('');
      setVehiculoPriv('');
    } else {
      // Limpiar los campos de transporte público
      setSelectedEmpresa('');
      setRuc('');
      setPlaca('');
      setTelefPub('');
      setVehiculoPub('');
    }
  };

  const handleEmpresaChange = (e) => {
    const empresa = e.target.value;
    setSelectedEmpresa(empresa);

    const selectedTrans = transpublicos.find(trans => trans.razonsocial === empresa);
    if (selectedTrans) {
      setRuc(selectedTrans.ruc);
      setPlaca(selectedTrans.placa);
      setTelefPub(selectedTrans.telefonopub);
      setVehiculoPub(selectedTrans.vehiculopub);
    } else {
      setRuc('');
      setPlaca('');
      setTelefPub('');
      setVehiculoPub('');
    }
  };

  const handleConductorChange = (e) => {
    const conductor = e.target.value;
    setSelectedConductor(conductor);

    const selectedTransPriv = transprivados.find(transp => transp.transportista === conductor);
    if (selectedTransPriv) {
      setDni(selectedTransPriv.dni);
      setPlacaPriv(selectedTransPriv.placa);
      setTelefPriv(selectedTransPriv.telefonopriv);
      setVehiculoPriv(selectedTransPriv.vehiculopriv);
    } else {
      setDni('');
      setPlacaPriv('');
      setTelefPriv('');
      setVehiculoPriv('');
    }
  };

  return (
    <div className="modal1-overlay">
      <div className="modal1">
        <div className='content-modal1'>
          <div className="modal-header">
            <h3 className="modal-title">{modalTitle}</h3>
            <button className="modal-close" onClick={onClose}>
              <IoMdClose className='text-3xl' />
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
                <button className='nuevo-transporte' onClick={openModalTransportista} disabled={!transportePublico}>
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
                  <label htmlFor="vehiculopub">Vehículo:</label>
                  <input
                    type="text"
                    id="vehiculopub"
                    value={vehiculopub}
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
                <button className='nuevo-transportista' onClick={openModalTransporte} disabled={transportePublico}>
                  <FaPlus />N. Transporte
                </button>
              </div>
              <div className='form-row'>
                <div className='form-group'>
                  <label htmlFor="transportista">Conductor:</label>
                  <select
                    id="transportista"
                    value={selectedConductor}
                    onChange={handleConductorChange}
                    disabled={transportePublico}
                    className={transportePublico ? 'bg-gray-300' : ''}
                  >
                    <option value="">Seleccione un Conductor</option>
                    {transprivados.map(transp => (
                      <option key={transp.id} value={transp.transportista}>{transp.transportista}</option>
                    ))}
                  </select>
                </div>
                <div className='form-group'>
                  <label htmlFor="dni">DNI:</label>
                  <input
                    type="text"
                    id="dni"
                    value={dni}
                    disabled
                    className={transportePublico ? 'bg-gray-300' : ''}
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor="vehiculo">Vehiculo:</label>
                  <input
                    type="text"
                    id="vehiculo"
                    value={vehiculopriv}
                    disabled
                    className={transportePublico ? 'bg-gray-300' : ''}
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor="placa-privada">Placa:</label>
                  <input
                    type="text"
                    id="placa-privada"
                    value={placapriv}
                    disabled
                    className={transportePublico ? 'bg-gray-300' : ''}
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor="telefono">Telefono:</label>
                  <input
                    type="text"
                    id="telefono"
                    value={telefonopriv}
                    disabled
                    className={transportePublico ? 'bg-gray-300' : ''}
                  />
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

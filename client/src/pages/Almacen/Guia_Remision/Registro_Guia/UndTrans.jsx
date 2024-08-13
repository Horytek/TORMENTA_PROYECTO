// TransporteForm.js

import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import './ModalGuias.css';
import { ButtonSave } from '@/components/Buttons/Buttons';
import { ModalTransporte } from './ModalGuias/ModalTransporte';
import { ModalTransportista } from './ModalGuias/ModalTransportista';
import useTransPubData from '../../data/data_transpub';
import useTransPrivData from '../../data/data_transpriv';
import { Toaster, toast } from 'react-hot-toast';

const TransporteForm = ({ modalTitle, onClose, onSave }) => {
  const [transportePublico, setTransportePublico] = useState(true);
  const [isModalOpenTransporte, setIsModalOpenTransporte] = useState(false);
  const [isModalOpenTransportista, setIsModalOpenTransportista] = useState(false);
  const { transpublicos, setTranspublicos } = useTransPubData(); // Añade setTranspublicos
  const { transprivados } = useTransPrivData();
  const [id, setID] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [ruc, setRuc] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefonopub, setTelefPub] = useState('');
  const [vehiculopub, setVehiculoPub] = useState('');
  const [idpriv, setIDPriv] = useState('');
  const [selectedConductor, setSelectedConductor] = useState('');
  const [dni, setDni] = useState('');
  const [placapriv, setPlacaPriv] = useState('');
  const [telefonopriv, setTelefPriv] = useState('');
  const [vehiculopriv, setVehiculoPriv] = useState('');

  const openModalTransporte = () => {
    setIsModalOpenTransporte(true);
  };

  const closeModalTransporte = () => {
    setIsModalOpenTransporte(false);
  };

  const openModalTransportista = () => {
    setIsModalOpenTransportista(true);
  };

  const closeModalTransportista = () => {
    setIsModalOpenTransportista(false);
  };

  const handleTransporteToggle = (value) => {
    setTransportePublico(value);
    if (value) {
      setSelectedConductor('');
      setDni('');
      setPlacaPriv('');
      setTelefPriv('');
      setVehiculoPriv('');
    } else {
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
      setID(selectedTrans.id);
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
      setID(selectedTransPriv.id);
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

  const handleSave = () => {
    if (transportePublico) {
      if (!selectedEmpresa) {
        toast.error('Por favor, selecciona una Transporte Público.');
        return;
      }
    } else {
      if (!selectedConductor) {
        toast.error('Por favor, selecciona una Transporte Privado.');
        return;
      }
    }

    const selectedTransporte = transportePublico
      ? {
          id:id,
          empresa: selectedEmpresa,
          ruc,
          placa,
          telefonopub,
          vehiculopub,
        }
      : {
          id:id,
          conductor: selectedConductor,
          dni,
          placa: placapriv,
          telefonopriv,
          vehiculopriv,
        };

    onSave(selectedTransporte);
    onClose();
  };

  const handleTransportistaAdded = () => {
    // Recargar los datos de transporte público
    useTransPubData().fetchTransPublicos(); // Suponiendo que fetchTransPublicos es el método para actualizar los datos
  };

  return (
    <div className="modal1-overlay">
      <Toaster />
      <div className="modal1">
        <div className="content-modal1">
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
                    value={selectedEmpresa && !vehiculopub ? "No presenta" : vehiculopub}
                    disabled
                    className="form-input disabled:bg-gray-300"
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor="placa">Placa:</label>
                  <input
                    type="text"
                    id="placa"
                    value={selectedEmpresa && !placa ? "No presenta" : placa}
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
                    value={selectedConductor && !vehiculopriv ? "No presenta" : vehiculopriv}
                    disabled
                    className={transportePublico ? 'bg-gray-300' : ''}
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor="placa-privada">Placa:</label>
                  <input
                    type="text"
                    id="placa-privada"
                    value={selectedConductor && !placapriv ? "No presenta" : placapriv}
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
          <div className="modal-buttons">
            <ButtonSave onClick={handleSave} />
          </div>
        </div>
      </div>
      {isModalOpenTransportista && (
        <ModalTransportista modalTitle={'Registrar Transporte'} closeModel={closeModalTransportista} onTransportistaAdded={handleTransportistaAdded} />
      )}
      {isModalOpenTransporte && (
        <ModalTransporte modalTitle={'Registrar Transportista'} closeModel={closeModalTransporte} />
      )}
    </div>
  );
};

TransporteForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default TransporteForm;

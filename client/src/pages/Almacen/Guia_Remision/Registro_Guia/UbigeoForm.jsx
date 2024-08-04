import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { IoCloseSharp } from 'react-icons/io5';
import './ModalGuias.css';
import { ButtonSave } from '@/components/Buttons/Buttons';
import useSucursalData from '../../data/data_ubigeo_guia';

const ProductosForm = ({ modalTitle, onClose }) => {
  const { ubigeos } = useSucursalData();
  
  // Estados para Ubigeo de Partida
  const [departamentosPartida, setDepartamentosPartida] = useState([]);
  const [provinciasPartida, setProvinciasPartida] = useState([]);
  const [distritosPartida, setDistritosPartida] = useState([]);
  const [selectedDepartamentoPartida, setSelectedDepartamentoPartida] = useState(null);
  const [selectedProvinciaPartida, setSelectedProvinciaPartida] = useState(null);
  const [selectedDistritoPartida, setSelectedDistritoPartida] = useState(null);
  
  // Estados para Ubigeo de Destino
  const [departamentosDestino, setDepartamentosDestino] = useState([]);
  const [provinciasDestino, setProvinciasDestino] = useState([]);
  const [distritosDestino, setDistritosDestino] = useState([]);
  const [selectedDepartamentoDestino, setSelectedDepartamentoDestino] = useState(null);
  const [selectedProvinciaDestino, setSelectedProvinciaDestino] = useState(null);
  const [selectedDistritoDestino, setSelectedDistritoDestino] = useState(null);

  // Cargar departamentos al inicio para ambas categorías
  useEffect(() => {
    if (ubigeos && ubigeos.length > 0) {
      const uniqueDepartments = [...new Set(ubigeos.map(item => item.departamento))];
      const departmentOptions = uniqueDepartments.map(departamento => ({ value: departamento, label: departamento }));
      setDepartamentosPartida(departmentOptions);
      setDepartamentosDestino(departmentOptions);
    }
  }, [ubigeos]);

  // Cargar provincias y distritos para Ubigeo de Partida
  useEffect(() => {
    if (selectedDepartamentoPartida) {
      const filteredProvincias = ubigeos
        .filter(item => item.departamento === selectedDepartamentoPartida.value)
        .map(item => item.provincia);
      const uniqueProvincias = [...new Set(filteredProvincias)];
      setProvinciasPartida(uniqueProvincias.map(provincia => ({ value: provincia, label: provincia })));
      setSelectedProvinciaPartida(null); // Reset provincia y distrito al cambiar departamento
      setSelectedDistritoPartida(null);
    } else {
      setProvinciasPartida([]);
      setDistritosPartida([]);
    }
  }, [selectedDepartamentoPartida, ubigeos]);

  useEffect(() => {
    if (selectedProvinciaPartida) {
      const filteredDistritos = ubigeos
        .filter(item => item.provincia === selectedProvinciaPartida.value && item.departamento === selectedDepartamentoPartida.value)
        .map(item => item.distrito);
      const uniqueDistritos = [...new Set(filteredDistritos)];
      setDistritosPartida(uniqueDistritos.map(distrito => ({ value: distrito, label: distrito })));
      setSelectedDistritoPartida(null);
    } else {
      setDistritosPartida([]);
    }
  }, [selectedProvinciaPartida, selectedDepartamentoPartida, ubigeos]);

  // Cargar provincias y distritos para Ubigeo de Destino
  useEffect(() => {
    if (selectedDepartamentoDestino) {
      const filteredProvincias = ubigeos
        .filter(item => item.departamento === selectedDepartamentoDestino.value)
        .map(item => item.provincia);
      const uniqueProvincias = [...new Set(filteredProvincias)];
      setProvinciasDestino(uniqueProvincias.map(provincia => ({ value: provincia, label: provincia })));
      setSelectedProvinciaDestino(null); // Reset provincia y distrito al cambiar departamento
      setSelectedDistritoDestino(null);
    } else {
      setProvinciasDestino([]);
      setDistritosDestino([]);
    }
  }, [selectedDepartamentoDestino, ubigeos]);

  useEffect(() => {
    if (selectedProvinciaDestino) {
      const filteredDistritos = ubigeos
        .filter(item => item.provincia === selectedProvinciaDestino.value && item.departamento === selectedDepartamentoDestino.value)
        .map(item => item.distrito);
      const uniqueDistritos = [...new Set(filteredDistritos)];
      setDistritosDestino(uniqueDistritos.map(distrito => ({ value: distrito, label: distrito })));
      setSelectedDistritoDestino(null);
    } else {
      setDistritosDestino([]);
    }
  }, [selectedProvinciaDestino, selectedDepartamentoDestino, ubigeos]);

  return (
    <div className="modal-container" >
      <div className="modal-ubi ">
        <div className='content-modal4'>
        <button onClick={onClose} className="close-modal-ubigeo top-0 right-0 text-black-500 p-3">
                                <IoCloseSharp />
            </button>
          <div className="modal-header ">
            <h3 className="modal-title">{modalTitle}</h3>
            
          </div>
          <div className='ubigeo-body'>
            {/* Partida */}
            <div className='modal-content'>
              <h4>Ubigeo de Partida</h4>
              <hr />
              <div className='form-group'>
                <label htmlFor="departamentoPartida" className='text-sm font-bold text-black'>Departamento:</label>
                <Select 
                  options={departamentosPartida}
                  value={selectedDepartamentoPartida}
                  onChange={setSelectedDepartamentoPartida}
                  className="input-c"
                  style={{ border: "solid 0.1rem #171a1f28", width: '11rem' }}
                  placeholder="Selecciona un departamento"
                />
              </div>
              <div className='form-group'>
                <label htmlFor="provinciaPartida" className='text-sm font-bold text-black'>Provincia:</label>
                <Select 
                  options={provinciasPartida}
                  value={selectedProvinciaPartida}
                  onChange={setSelectedProvinciaPartida}
                  className="input-c"
                  style={{ border: "solid 0.1rem #171a1f28", width: '11rem' }}
                  placeholder="Selecciona una provincia"
                  isDisabled={!selectedDepartamentoPartida}
                />
              </div>
              <div className='form-group'>
                <label htmlFor="distritoPartida" className='text-sm font-bold text-black'>Distrito:</label>
                <Select 
                  options={distritosPartida}
                  value={selectedDistritoPartida}
                  onChange={setSelectedDistritoPartida}
                  className="input-c"
                  style={{ border: "solid 0.1rem #171a1f28", width: '11rem' }}
                  placeholder="Selecciona un distrito"
                  isDisabled={!selectedProvinciaPartida}
                />
              </div>
            </div>
            {/* Destino */}
            <div className='modal-content'>
              <h4>Ubigeo de Destino</h4>
              <hr />
              <div className='form-group'>
                <label htmlFor="departamentoDestino" className='text-sm font-bold text-black'>Departamento:</label>
                <Select 
                  options={departamentosDestino}
                  value={selectedDepartamentoDestino}
                  onChange={setSelectedDepartamentoDestino}
                  className="input-c"
                  style={{ border: "solid 0.1rem #171a1f28", width: '11rem' }}
                  placeholder="Selecciona un departamento"
                />
              </div>
              <div className='form-group'>
                <label htmlFor="provinciaDestino" className='text-sm font-bold text-black'>Provincia:</label>
                <Select 
                  options={provinciasDestino}
                  value={selectedProvinciaDestino}
                  onChange={setSelectedProvinciaDestino}
                  className="input-c"
                  style={{ border: "solid 0.1rem #171a1f28", width: '11rem' }}
                  placeholder="Selecciona una provincia"
                  isDisabled={!selectedDepartamentoDestino}
                />
              </div>
              <div className='form-group'>
                <label htmlFor="distritoDestino" className='text-sm font-bold text-black'>Distrito:</label>
                <Select 
                  options={distritosDestino}
                  value={selectedDistritoDestino}
                  onChange={setSelectedDistritoDestino}
                  className="input-c"
                  style={{ border: "solid 0.1rem #171a1f28", width: '11rem' }}
                  placeholder="Selecciona un distrito"
                  isDisabled={!selectedProvinciaDestino}
                />
              </div>
            </div>
            <div className='modal-buttons'>
              
              <ButtonSave/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ProductosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProductosForm;

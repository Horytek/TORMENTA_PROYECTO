import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { IoCloseSharp } from 'react-icons/io5';
import { ButtonSave } from '@/components/Buttons/Buttons';
import useSucursalData from '../../data/data_ubigeo_guia';
import { Toaster, toast } from 'react-hot-toast';

const UbigeoForm = ({ modalTitle, onClose, onSave }) => {
  const { ubigeos } = useSucursalData();
  const [selectedUbipart, setSelectedUbipart] = useState('');
  const [selectedUbidest, setSelectedUbidest] = useState('');

  // Estado para Ubigeo de Partida
  const [ubigeoPartida, setUbigeoPartida] = useState({});

  // Estado para Ubigeo de Destino
  const [ubigeoDestino, setUbigeoDestino] = useState({});

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
      setProvinciasPartida(uniqueProvincias.map(provincia => ({
        value: provincia,
        label: provincia,
        cod: ubigeos.find(item => item.provincia === provincia && item.departamento === selectedDepartamentoPartida.value)?.cod
      })));
      setSelectedProvinciaPartida(null);
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
      setDistritosPartida(uniqueDistritos.map(distrito => ({
        value: distrito,
        label: distrito,
        id: ubigeos.find(item => item.distrito === distrito && item.provincia === selectedProvinciaPartida.value && item.departamento === selectedDepartamentoPartida.value)?.id
      })));
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
      setProvinciasDestino(uniqueProvincias.map(provincia => ({
        value: provincia,
        label: provincia,
        cod: ubigeos.find(item => item.provincia === provincia && item.departamento === selectedDepartamentoDestino.value)?.cod
      })));
      setSelectedProvinciaDestino(null);
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
      setDistritosDestino(uniqueDistritos.map(distrito => ({
        value: distrito,
        label: distrito,
        id: ubigeos.find(item => item.distrito === distrito && item.provincia === selectedProvinciaDestino.value && item.departamento === selectedDepartamentoDestino.value)?.id
      })));
      setSelectedDistritoDestino(null);
    } else {
      setDistritosDestino([]);
    }
  }, [selectedProvinciaDestino, selectedDepartamentoDestino, ubigeos]);

  const handleSave = () => {
    if (
      !selectedDepartamentoPartida ||
      !selectedProvinciaPartida ||
      !selectedDistritoPartida ||
      !selectedDepartamentoDestino ||
      !selectedProvinciaDestino ||
      !selectedDistritoDestino
    ) {
      toast.error('Por favor, selecciona todos los campos para Ubigeo de Partida y Destino.');
      return;
    }

    const partida = `${distritosPartida.find(d => d.value === selectedDistritoPartida.value)?.id}`;
    const destino = `${distritosDestino.find(d => d.value === selectedDistritoDestino.value)?.id}`;
    
    onSave(partida, destino); // Guarda los datos
    onClose(); // Cierra el modal
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-11/12 overflow-y-auto p-6">
        <Toaster />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-black bg-red-500 text-xl p-2 rounded-full"
        >
          <IoCloseSharp />
        </button>
        <div className="border-b border-gray-200 mb-4">
          <h3 className="text-2xl font-bold text-black">{modalTitle}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Ubigeo Partida */}
          <div>
            <h4 className="text-center font-bold mb-2">Ubigeo de Partida</h4>
            <div className="form-group">
              <label htmlFor="departamentoPartida" className="text-sm font-bold text-black">Departamento:</label>
              <Select 
                options={departamentosPartida}
                value={selectedDepartamentoPartida}
                onChange={setSelectedDepartamentoPartida}
                className="input-c"
                placeholder="Selecciona un departamento"
              />
            </div>
            <div className="form-group">
              <label htmlFor="provinciaPartida" className="text-sm font-bold text-black">Provincia:</label>
              <Select 
                options={provinciasPartida}
                value={selectedProvinciaPartida}
                onChange={setSelectedProvinciaPartida}
                className="input-c"
                placeholder="Selecciona una provincia"
                isDisabled={!selectedDepartamentoPartida}
              />
            </div>
            <div className="form-group">
              <label htmlFor="distritoPartida" className="text-sm font-bold text-black">Distrito:</label>
              <Select 
                options={distritosPartida}
                value={selectedDistritoPartida}
                onChange={setSelectedDistritoPartida}
                className="input-c"
                placeholder="Selecciona un distrito"
                isDisabled={!selectedProvinciaPartida}
              />
            </div>
          </div>
          {/* Ubigeo Destino */}
          <div>
            <h4 className="text-center font-bold mb-2">Ubigeo de Destino</h4>
            <div className="form-group">
              <label htmlFor="departamentoDestino" className="text-sm font-bold text-black">Departamento:</label>
              <Select 
                options={departamentosDestino}
                value={selectedDepartamentoDestino}
                onChange={setSelectedDepartamentoDestino}
                className="input-c"
                placeholder="Selecciona un departamento"
              />
            </div>
            <div className="form-group">
              <label htmlFor="provinciaDestino" className="text-sm font-bold text-black">Provincia:</label>
              <Select 
                options={provinciasDestino}
                value={selectedProvinciaDestino}
                onChange={setSelectedProvinciaDestino}
                className="input-c"
                placeholder="Selecciona una provincia"
                isDisabled={!selectedDepartamentoDestino}
              />
            </div>
            <div className="form-group">
              <label htmlFor="distritoDestino" className="text-sm font-bold text-black">Distrito:</label>
              <Select 
                options={distritosDestino}
                value={selectedDistritoDestino}
                onChange={setSelectedDistritoDestino}
                className="input-c"
                placeholder="Selecciona un distrito"
                isDisabled={!selectedProvinciaDestino}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <ButtonSave onClick={handleSave} />
        </div>
      </div>
    </div>
  );
};

UbigeoForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default UbigeoForm;

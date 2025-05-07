import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { IoCloseSharp } from 'react-icons/io5';
import { ButtonSave } from '@/components/Buttons/Buttons';
import useSucursalData from '../../data/data_ubigeo_guia';
import { Toaster, toast } from 'react-hot-toast';

const UbigeoForm = ({ modalTitle, onClose, onSave }) => {
  const { ubigeos } = useSucursalData();

  const [selectedDepartamentoPartida, setSelectedDepartamentoPartida] = useState(null);
  const [selectedProvinciaPartida, setSelectedProvinciaPartida] = useState(null);
  const [selectedDistritoPartida, setSelectedDistritoPartida] = useState(null);

  const [selectedDepartamentoDestino, setSelectedDepartamentoDestino] = useState(null);
  const [selectedProvinciaDestino, setSelectedProvinciaDestino] = useState(null);
  const [selectedDistritoDestino, setSelectedDistritoDestino] = useState(null);

  const [departamentosPartida, setDepartamentosPartida] = useState([]);
  const [provinciasPartida, setProvinciasPartida] = useState([]);
  const [distritosPartida, setDistritosPartida] = useState([]);

  const [departamentosDestino, setDepartamentosDestino] = useState([]);
  const [provinciasDestino, setProvinciasDestino] = useState([]);
  const [distritosDestino, setDistritosDestino] = useState([]);

  useEffect(() => {
    if (ubigeos && ubigeos.length > 0) {
      const uniqueDepartments = [...new Set(ubigeos.map(item => item.departamento))];
      const departmentOptions = uniqueDepartments.map(dep => ({ value: dep, label: dep }));
      setDepartamentosPartida(departmentOptions);
      setDepartamentosDestino(departmentOptions);
    }
  }, [ubigeos]);

  useEffect(() => {
    if (selectedDepartamentoPartida) {
      const provincias = ubigeos
        .filter(u => u.departamento === selectedDepartamentoPartida.value)
        .map(u => u.provincia);
      const uniqueProvincias = [...new Set(provincias)];
      setProvinciasPartida(uniqueProvincias.map(prov => ({
        value: prov,
        label: prov
      })));
      setSelectedProvinciaPartida(null);
      setSelectedDistritoPartida(null);
    }
  }, [selectedDepartamentoPartida, ubigeos]);

  useEffect(() => {
    if (selectedProvinciaPartida && selectedDepartamentoPartida) {
      const distritos = ubigeos
        .filter(u =>
          u.departamento === selectedDepartamentoPartida.value &&
          u.provincia === selectedProvinciaPartida.value)
        .map(u => u.distrito);
      const uniqueDistritos = [...new Set(distritos)];
      setDistritosPartida(uniqueDistritos.map(dist => ({
        value: dist,
        label: dist,
        id: ubigeos.find(u => u.distrito === dist && u.provincia === selectedProvinciaPartida.value)?.id
      })));
      setSelectedDistritoPartida(null);
    }
  }, [selectedProvinciaPartida, selectedDepartamentoPartida, ubigeos]);

  useEffect(() => {
    if (selectedDepartamentoDestino) {
      const provincias = ubigeos
        .filter(u => u.departamento === selectedDepartamentoDestino.value)
        .map(u => u.provincia);
      const uniqueProvincias = [...new Set(provincias)];
      setProvinciasDestino(uniqueProvincias.map(prov => ({
        value: prov,
        label: prov
      })));
      setSelectedProvinciaDestino(null);
      setSelectedDistritoDestino(null);
    }
  }, [selectedDepartamentoDestino, ubigeos]);

  useEffect(() => {
    if (selectedProvinciaDestino && selectedDepartamentoDestino) {
      const distritos = ubigeos
        .filter(u =>
          u.departamento === selectedDepartamentoDestino.value &&
          u.provincia === selectedProvinciaDestino.value)
        .map(u => u.distrito);
      const uniqueDistritos = [...new Set(distritos)];
      setDistritosDestino(uniqueDistritos.map(dist => ({
        value: dist,
        label: dist,
        id: ubigeos.find(u => u.distrito === dist && u.provincia === selectedProvinciaDestino.value)?.id
      })));
      setSelectedDistritoDestino(null);
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
      toast.error('Por favor, completa todos los campos.');
      return;
    }

    const partida = distritosPartida.find(d => d.value === selectedDistritoPartida.value)?.id;
    const destino = distritosDestino.find(d => d.value === selectedDistritoDestino.value)?.id;

    onSave(partida, destino);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Toaster />
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-3xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors"
        >
          <IoCloseSharp size={22} />
        </button>
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white mb-6">{modalTitle}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ubigeo de Partida */}
          <div>
            <h4 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-center">Partida</h4>
            <div className="space-y-4">
              <Select
                options={departamentosPartida}
                value={selectedDepartamentoPartida}
                onChange={setSelectedDepartamentoPartida}
                placeholder="Departamento"
              />
              <Select
                options={provinciasPartida}
                value={selectedProvinciaPartida}
                onChange={setSelectedProvinciaPartida}
                placeholder="Provincia"
                isDisabled={!selectedDepartamentoPartida}
              />
              <Select
                options={distritosPartida}
                value={selectedDistritoPartida}
                onChange={setSelectedDistritoPartida}
                placeholder="Distrito"
                isDisabled={!selectedProvinciaPartida}
              />
            </div>
          </div>

          {/* Ubigeo de Destino */}
          <div>
            <h4 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-center">Destino</h4>
            <div className="space-y-4">
              <Select
                options={departamentosDestino}
                value={selectedDepartamentoDestino}
                onChange={setSelectedDepartamentoDestino}
                placeholder="Departamento"
              />
              <Select
                options={provinciasDestino}
                value={selectedProvinciaDestino}
                onChange={setSelectedProvinciaDestino}
                placeholder="Provincia"
                isDisabled={!selectedDepartamentoDestino}
              />
              <Select
                options={distritosDestino}
                value={selectedDistritoDestino}
                onChange={setSelectedDistritoDestino}
                placeholder="Distrito"
                isDisabled={!selectedProvinciaDestino}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
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

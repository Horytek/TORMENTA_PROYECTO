import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  RadioGroup,
  Radio,
  Select,
  SelectItem,
} from '@heroui/react';
import { IoMdClose } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import { Toaster, toast } from 'react-hot-toast';
import { ModalTransporte } from './ModalGuias/ModalTransporte';
import { ModalTransportista } from './ModalGuias/ModalTransportista';
import { getTransportistasPublicos, getTransportistasPrivados } from '@/services/guiaRemision.services';

const TransporteForm = ({ modalTitle, onClose, onSave }) => {
  const [transportePublico, setTransportePublico] = useState(true);
  const [isModalOpenTransporte, setIsModalOpenTransporte] = useState(false);
  const [isModalOpenTransportista, setIsModalOpenTransportista] = useState(false);
  const [transpublicos, setTranspublicos] = useState([]);
  const [transprivados, setTransprivados] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedConductor, setSelectedConductor] = useState('');
  const [ruc, setRuc] = useState('');
  const [placa, setPlaca] = useState('');
  const [vehiculo, setVehiculo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  
  // Cargar transportistas en paralelo
  useEffect(() => {
    const fetchTransportistas = async () => {
      const [publicosRes, privadosRes] = await Promise.all([
        getTransportistasPublicos(),
        getTransportistasPrivados()
      ]);
      
      if (publicosRes.success) setTranspublicos(publicosRes.data);
      if (privadosRes.success) setTransprivados(privadosRes.data);
    };
    fetchTransportistas();
  }, []);

  const openModalTransporte = () => setIsModalOpenTransporte(true);
  const closeModalTransporte = () => setIsModalOpenTransporte(false);

  const openModalTransportista = () => setIsModalOpenTransportista(true);
  const closeModalTransportista = () => setIsModalOpenTransportista(false);

  const handleTransporteToggle = (value) => {
    setTransportePublico(value === 'publico');
    resetFields();
  };

  const resetFields = () => {
    setSelectedEmpresa('');
    setSelectedConductor('');
    setRuc('');
    setPlaca('');
    setVehiculo('');
    setTelefono('');
    setDni('');
  };

  const handleEmpresaChange = (value) => {
    setSelectedEmpresa(value);
    const selectedTrans = transpublicos.find(trans => trans.razonsocial === value);
    if (selectedTrans) {
      setRuc(selectedTrans.ruc);
      setPlaca(selectedTrans.placa);
      setVehiculo(selectedTrans.vehiculopub);
      setTelefono(selectedTrans.telefonopub);
    } else {
      resetFields();
    }
  };

  const handleConductorChange = (value) => {
    setSelectedConductor(value);
    const selectedTransPriv = transprivados.find(trans => trans.transportista === value);
    if (selectedTransPriv) {
      setDni(selectedTransPriv.dni);
      setPlaca(selectedTransPriv.placa);
      setVehiculo(selectedTransPriv.vehiculopriv);
      setTelefono(selectedTransPriv.telefonopriv);
    } else {
      resetFields();
    }
  };

const handleSave = () => {
  if (transportePublico && !selectedEmpresa) {
    toast.error('Por favor, selecciona una empresa de transporte público.');
    return;
  }
  if (!transportePublico && !selectedConductor) {
    toast.error('Por favor, selecciona un conductor de transporte privado.');
    return;
  }

  let selectedTransporte;
  if (transportePublico) {
    const trans = transpublicos.find(t => t.razonsocial === selectedEmpresa);
    selectedTransporte = {
      tipo: 'publico',
      empresa: selectedEmpresa,
      ruc,
      placa,
      vehiculo,
      telefono,
      id: trans ? trans.id : '', // <-- Aquí se agrega el id
    };
  } else {
    const trans = transprivados.find(t => t.transportista === selectedConductor);
    selectedTransporte = {
      tipo: 'privado',
      conductor: selectedConductor,
      dni,
      placa,
      vehiculo,
      telefono,
      id: trans ? trans.id : '', // <-- Aquí se agrega el id
    };
  }

  onSave(selectedTransporte);
  onClose();
};

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <Toaster />
      <ModalContent>
        <ModalHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{modalTitle}</h2>
          </div>
        </ModalHeader>

        <ModalBody>
          <RadioGroup
            label="Tipo de Transporte"
            value={transportePublico ? 'publico' : 'privado'}
            onValueChange={(value) => handleTransporteToggle(value)}
            orientation="horizontal"
            className="mb-4"
          >
            <Radio value="publico">Transporte Público</Radio>
            <Radio value="privado">Transporte Privado</Radio>
          </RadioGroup>

          {transportePublico ? (
            <div className="space-y-4">
              <Select
                label="Empresa"
                placeholder="Seleccione una empresa"
                selectedKeys={[selectedEmpresa]}
                onSelectionChange={(keys) => handleEmpresaChange(keys.values().next().value)}
              >
                {transpublicos.map(trans => (
                  <SelectItem key={trans.razonsocial} value={trans.razonsocial}>
                    {trans.razonsocial}
                  </SelectItem>
                ))}
              </Select>
              <Input label="RUC" value={ruc} isReadOnly />
              <Input label="Vehículo" value={vehiculo || 'No presenta'} isReadOnly />
              <Input label="Placa" value={placa || 'No presenta'} isReadOnly />
              <Input label="Teléfono" value={telefono} isReadOnly />
              <Button
                variant="light"
                onPress={openModalTransportista}
                startContent={<FaPlus />}
                className="w-full"
              >
                Nuevo Transporte Público
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                label="Conductor"
                placeholder="Seleccione un conductor"
                selectedKeys={[selectedConductor]}
                onSelectionChange={(keys) => handleConductorChange(keys.values().next().value)}
              >
                {transprivados.map(trans => (
                  <SelectItem key={trans.transportista} value={trans.transportista}>
                    {trans.transportista}
                  </SelectItem>
                ))}
              </Select>
              <Input label="DNI" value={dni} isReadOnly />
              <Input label="Vehículo" value={vehiculo || 'No presenta'} isReadOnly />
              <Input label="Placa" value={placa || 'No presenta'} isReadOnly />
              <Input label="Teléfono" value={telefono} isReadOnly />
              <Button
                variant="light"
                onPress={openModalTransporte}
                startContent={<FaPlus />}
                className="w-full"
              >
                Nuevo Transporte Privado
              </Button>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave}>
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>

      {isModalOpenTransportista && (
        <ModalTransportista
          modalTitle="Registrar Transporte Público"
          closeModel={closeModalTransportista}
        />
      )}
      {isModalOpenTransporte && (
        <ModalTransporte
          modalTitle="Registrar Transporte Privado"
          closeModel={closeModalTransporte}
        />
      )}
    </Modal>
  );
};

TransporteForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default TransporteForm;
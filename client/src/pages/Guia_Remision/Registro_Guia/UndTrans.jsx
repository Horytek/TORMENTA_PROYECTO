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
import { toast } from 'react-hot-toast';
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
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      backdrop="blur"
      classNames={{
        backdrop: "z-[1200] bg-white/10",
        base: "z-[1210] pointer-events-auto bg-white/80 dark:bg-zinc-900/80 supports-[backdrop-filter]:backdrop-blur-xl border border-blue-100/40 dark:border-zinc-700/50 shadow-2xl rounded-2xl",
        header: "px-6 py-4 border-b border-blue-100/30 dark:border-zinc-700/40",
        body: "px-6 pb-4 pt-4",
        footer: "px-6 py-4 border-t border-blue-100/30 dark:border-zinc-700/40"
      }}
      motionProps={{
        variants: {
          enter: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 12, scale: 0.97 }
        }
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-blue-100">{modalTitle}</h2>
            <p className="text-xs text-slate-500 font-normal">Seleccione los datos del transporte y conductor</p>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="bg-slate-50/50 dark:bg-zinc-800/50 p-1 rounded-xl mb-4 self-center inline-flex">
            <RadioGroup
              value={transportePublico ? 'publico' : 'privado'}
              onValueChange={(value) => handleTransporteToggle(value)}
              orientation="horizontal"
              classNames={{
                wrapper: "gap-0"
              }}
            >
              <Radio
                value="publico"
                classNames={{
                  base: `px-4 py-2 rounded-lg transition-colors cursor-pointer ${transportePublico ? 'bg-white shadow-sm dark:bg-zinc-700' : 'hover:bg-gray-200/50'}`,
                  label: `text-sm font-semibold ${transportePublico ? 'text-blue-600' : 'text-slate-500'}`
                }}
              >
                Público
              </Radio>
              <Radio
                value="privado"
                classNames={{
                  base: `px-4 py-2 rounded-ld transition-colors cursor-pointer ${!transportePublico ? 'bg-white shadow-sm dark:bg-zinc-700' : 'hover:bg-gray-200/50'}`,
                  label: `text-sm font-semibold ${!transportePublico ? 'text-blue-600' : 'text-slate-500'}`
                }}
              >
                Privado
              </Radio>
            </RadioGroup>
          </div>

          {transportePublico ? (
            <div className="space-y-4">
              <Select
                variant="flat"
                label="Empresa"
                placeholder="Seleccione una empresa"
                selectedKeys={selectedEmpresa ? [selectedEmpresa] : []}
                onSelectionChange={(keys) => handleEmpresaChange(keys.values().next().value)}
                classNames={{ trigger: "bg-white/50 dark:bg-zinc-800/50 border border-slate-200/50" }}
              >
                {transpublicos.map(trans => (
                  <SelectItem key={trans.razonsocial} value={trans.razonsocial} textValue={trans.razonsocial}>
                    {trans.razonsocial}
                  </SelectItem>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input variant="flat" label="RUC" value={ruc} isReadOnly classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }} />
                <Input variant="flat" label="Placa" value={placa || 'No presenta'} isReadOnly classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input variant="flat" label="Vehículo" value={vehiculo || 'No presenta'} isReadOnly classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }} />
                <Input variant="flat" label="Teléfono" value={telefono} isReadOnly classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }} />
              </div>

              <Button
                variant="dashed"
                color="primary"
                onPress={openModalTransportista}
                startContent={<FaPlus />}
                className="w-full border-blue-200 text-blue-600 bg-blue-50/30 hover:bg-blue-50 h-10"
              >
                Nuevo Transporte Público
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                variant="flat"
                label="Conductor"
                placeholder="Seleccione un conductor"
                selectedKeys={selectedConductor ? [selectedConductor] : []}
                onSelectionChange={(keys) => handleConductorChange(keys.values().next().value)}
                classNames={{ trigger: "bg-white/50 dark:bg-zinc-800/50 border border-slate-200/50" }}
              >
                {transprivados.map(trans => (
                  <SelectItem key={trans.transportista} value={trans.transportista} textValue={trans.transportista}>
                    {trans.transportista}
                  </SelectItem>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input variant="flat" label="DNI" value={dni} isReadOnly classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }} />
                <Input variant="flat" label="Placa" value={placa || 'No presenta'} isReadOnly classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input variant="flat" label="Vehículo" value={vehiculo || 'No presenta'} isReadOnly classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }} />
                <Input variant="flat" label="Teléfono" value={telefono} isReadOnly classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }} />
              </div>

              <Button
                variant="dashed"
                color="primary"
                onPress={openModalTransporte}
                startContent={<FaPlus />}
                className="w-full border-blue-200 text-blue-600 bg-blue-50/30 hover:bg-blue-50 h-10"
              >
                Nuevo Transporte Privado
              </Button>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" color="default" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave} className="shadow-lg shadow-blue-500/20">
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
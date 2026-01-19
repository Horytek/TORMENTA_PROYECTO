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
} from '@heroui/react';

import { FaRegPlusSquare } from "react-icons/fa";
import { generarCodigoTransportista, addTransportistaPublico } from '@/services/guiaRemision.services';
import ModalVehiculo from './ModalVehiculo';
import toast from 'react-hot-toast';

export const ModalTransportista = ({ modalTitle, closeModel, onTransportistaAdded }) => {
  const [isVehiculoModalOpen, setVehiculoModalOpen] = useState(false);
  const [vehiculoPlaca, setVehiculoPlaca] = useState('');
  const [ruc, setRuc] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [id, setId] = useState('');

  useEffect(() => {
    const fetchCodigo = async () => {
      const response = await generarCodigoTransportista();
      if (response.success && response.data && response.data.length > 0) {
        setId(response.data[0].codtrans); // Asumiendo que retorna un array con un objeto {codtrans: ...}
      }
    }
    fetchCodigo();
  }, []);

  const openVehiculoModal = () => setVehiculoModalOpen(true);
  const closeVehiculoModal = () => setVehiculoModalOpen(false);

  const handlePlacaUpdate = (placa) => {
    setVehiculoPlaca(placa);
    closeVehiculoModal();
  };

  const handleSave = async () => {
    const data = {
      id,
      placa: vehiculoPlaca,
      ruc,
      razon_social: empresa,
      telefono,
    };

    const result = await addTransportistaPublico(data);
    if (result.success) {
      toast.success('Transportista guardado con éxito');
      if (onTransportistaAdded) onTransportistaAdded();
      closeModel();
    } else {
      toast.error(`Error al guardar el transportista: ${result.message}`);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={closeModel}
      size="lg"
      backdrop="opaque"
      classNames={{
        backdrop: "bg-slate-900/50 backdrop-blur-sm",
        base: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-2xl",
        header: "px-6 py-4 border-b border-slate-100 dark:border-zinc-800",
        body: "px-6 py-4",
        footer: "px-6 py-4 border-t border-slate-100 dark:border-zinc-800"
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-blue-100">{modalTitle}</h2>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <Input
              variant="flat"
              label="Nuevo Código"
              value={id}
              isReadOnly
              classNames={{ inputWrapper: "bg-slate-100/50 border-transparent text-slate-500" }}
            />
            <Input
              variant="flat"
              label="RUC"
              placeholder="Ingrese el RUC"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
            />
            <Input
              variant="flat"
              label="Empresa"
              placeholder="Ingrese el nombre de la empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
            />
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1">
                Placa (Opcional)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  variant="flat"
                  value={vehiculoPlaca}
                  isReadOnly
                  className="flex-grow"
                  classNames={{ inputWrapper: "bg-slate-100/50 border-transparent shadow-none" }}
                />
                <Button
                  variant="dashed"
                  color="primary"
                  onPress={openVehiculoModal}
                  startContent={<FaRegPlusSquare className="text-lg" />}
                  className="bg-blue-50/50 border-blue-200 text-blue-600 h-10 px-4"
                >
                  Agregar
                </Button>
              </div>
            </div>
            <Input
              variant="flat"
              label="Teléfono"
              placeholder="Ingrese el teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              classNames={{ inputWrapper: "bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700" }}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" color="default" onPress={closeModel}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave} className="shadow-lg shadow-blue-500/20">
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>

      {isVehiculoModalOpen && (
        <ModalVehiculo
          modalTitle="Nuevo Vehículo"
          closeModel={closeVehiculoModal}
          onVehiculoSaved={handlePlacaUpdate}
        />
      )}
    </Modal>
  );
};

ModalTransportista.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  closeModel: PropTypes.func.isRequired,
  onTransportistaAdded: PropTypes.func.isRequired,
};

export default ModalTransportista;
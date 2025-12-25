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
import { IoMdClose } from "react-icons/io";
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
    <Modal isOpen={true} onClose={closeModel} size="lg">
      <ModalContent>
        <ModalHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold">{modalTitle}</h2>
            <Button isIconOnly variant="light" onPress={closeModel}>
              <IoMdClose className="text-xl" />
            </Button>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Nuevo Código"
              value={id}
              isReadOnly
              className="bg-gray-200"
              variant="flat"
            />
            <Input
              label="RUC"
              placeholder="Ingrese el RUC"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              variant="flat"
            />
            <Input
              label="Empresa"
              placeholder="Ingrese el nombre de la empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              variant="flat"
            />
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                Placa (Opcional)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={vehiculoPlaca}
                  isReadOnly
                  className="flex-grow"
                  variant="flat"
                />
                <Button
                  variant="flat"
                  onPress={openVehiculoModal}
                  startContent={<FaRegPlusSquare className="text-xl" />}
                >
                  Agregar
                </Button>
              </div>
            </div>
            <Input
              label="Teléfono"
              placeholder="Ingrese el teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              variant="flat"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" onPress={closeModel}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave}>
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
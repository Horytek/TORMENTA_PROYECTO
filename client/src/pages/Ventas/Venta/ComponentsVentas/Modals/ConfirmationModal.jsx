import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

const ConfirmationModal = ({ confirmDeleteModalOpen, handleDeleteVenta, setConfirmDeleteModalOpen }) => {
  return (
    <Modal
      isOpen={confirmDeleteModalOpen}
      onClose={() => setConfirmDeleteModalOpen(false)}
      placement="center"
    >
      <ModalContent className="bg-white rounded-lg">
        <ModalHeader className="flex items-center gap-2 border-b pb-2">
          <IoMdOptions className="text-xl" />
          <span>Confirmación</span>
        </ModalHeader>
        <ModalBody className="py-4">
          <p className="text-gray-700">¿Desea eliminar esta venta?</p>
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={() => setConfirmDeleteModalOpen(false)} className="mr-2">
            Cancelar
          </Button>
          <Button color="danger" variant="shadow" onPress={handleDeleteVenta}>
            Eliminar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

ConfirmationModal.propTypes = {
  confirmDeleteModalOpen: PropTypes.bool.isRequired,
  handleDeleteVenta: PropTypes.func.isRequired,
  setConfirmDeleteModalOpen: PropTypes.func.isRequired,
};

export default ConfirmationModal;
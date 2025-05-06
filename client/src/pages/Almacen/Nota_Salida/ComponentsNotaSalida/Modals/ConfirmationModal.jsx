import PropTypes from 'prop-types';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';

const ConfirmationModal = ({ message, onClose, isOpen, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-bold text-center">Confirmación</h2>
        </ModalHeader>
        <ModalBody>
          <p className="text-center text-gray-700">{message}</p>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-2">
          <Button color="default" variant="light" onPress={onClose}>
            Cerrar
          </Button>
          <Button color="success" onPress={onConfirm}>
            Confirmar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

ConfirmationModal.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ConfirmationModal;
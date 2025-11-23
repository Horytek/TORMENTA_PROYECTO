import PropTypes from 'prop-types';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@heroui/react';

const ConfirmationModal = ({ message, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/40 backdrop-blur-sm",
        base: "rounded-2xl border border-blue-100 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 shadow-xl",
        header: "px-6 pt-5 pb-2",
        body: "px-6 py-2",
        footer: "px-6 pb-5 pt-2"
      }}
      motionProps={{
        variants: {
          enter: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 10, scale: 0.98 }
        }
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-blue-700 dark:text-blue-200">Confirmación</h3>
        </ModalHeader>

        <ModalBody>
          <p className="text-base text-gray-700 dark:text-gray-300 text-center">
            {message}
          </p>
        </ModalBody>

        <ModalFooter className="justify-center gap-3">
          <Button
            variant="flat"
            color="danger"
            className="bg-rose-50 dark:bg-rose-900/30"
            onPress={onClose}
          >
            Cerrar
          </Button>
          <Button
            color="success"
            className="text-white"
            onPress={onConfirm}
          >
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
  onConfirm: PropTypes.func.isRequired,
};

export default ConfirmationModal;
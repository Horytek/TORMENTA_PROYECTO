import PropTypes from 'prop-types';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@heroui/react';
import { AlertCircle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: "bg-slate-900/40 backdrop-blur-sm",
        base: "rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl",
        header: "px-6 pt-6 pb-2",
        body: "px-6 py-3",
        footer: "px-6 pb-6 pt-4"
      }}
      motionProps={{
        variants: {
          enter: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 10, scale: 0.98 }
        }
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 items-center text-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full mb-2">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title || "Confirmación"}</h3>
        </ModalHeader>

        <ModalBody className="text-center">
          <p className="text-base font-medium text-slate-500 dark:text-slate-400">
            {message}
          </p>
        </ModalBody>

        <ModalFooter className="justify-center gap-3">
          <Button
            variant="flat"
            className="bg-slate-100 text-slate-600 font-bold dark:bg-zinc-800 dark:text-slate-300 rounded-xl px-6"
            onPress={onClose}
          >
            Cancelar
          </Button>
          <Button
            color="danger"
            className="font-bold shadow-lg shadow-red-500/20 rounded-xl px-6"
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
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ConfirmationModal;
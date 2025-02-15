import PropTypes from 'prop-types';
import { Button} from '@nextui-org/react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ message, onClose, onConfirm }) => {
  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal">
        <h2 className="confirmation-modal-title">Confirmación</h2>
        <p className="confirmation-modal-message">{message}</p>
        <div className="confirmation-modal-buttons">
        <Button auto flat color="danger" variant="shadow" onClick={onClose} className="mr-2">
          Cerrar
        </Button>
        <Button auto color="success" variant="shadow" onClick={onConfirm}>
          Confirmar
        </Button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ConfirmationModal;
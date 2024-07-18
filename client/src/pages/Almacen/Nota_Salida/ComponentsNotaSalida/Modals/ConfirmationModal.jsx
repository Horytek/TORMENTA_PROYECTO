import PropTypes from 'prop-types';
import './ConfirmationModal.css';

const ConfirmationModal = ({ message, onClose, isOpen, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal">
        <h2 className="confirmation-modal-title">Confirmación</h2>
        <p className="confirmation-modal-message">{message}</p>
        <div className="confirmation-modal-buttons">
          <button className="confirmation-modal-button confirmation-modal-close" onClick={onClose}>
            Cerrar
          </button>
          <button className="confirmation-modal-button confirmation-modal-confirm" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default ConfirmationModal;

// src/components/AlertModal/AlertModal.jsx

import PropTypes from 'prop-types';
import { Button} from '@nextui-org/react';
import './AlertModal.css';

const AlertModal = ({ message, onClose }) => {
  return (
    <div className="alert-modal-overlay">
      <div className="alert-modal">
        <h2 className="alert-modal-title">Error</h2>
        <p className="alert-modal-message">{message}</p>
        <Button className="alert-modal-button" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  );
};

AlertModal.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AlertModal;

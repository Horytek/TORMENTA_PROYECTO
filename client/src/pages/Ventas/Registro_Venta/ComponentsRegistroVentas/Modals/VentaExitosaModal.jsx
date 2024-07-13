import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { BsCheckCircle } from 'react-icons/bs';

const VentaExitosaModal = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            const timeout = setTimeout(() => {
                onClose();
                window.location.reload();
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [isOpen, onClose]);

    return isOpen ? (
        <div className="modal-container">
            <div className="modal-content-c">
                <div className="modal-header">
                    <h2 className="text-lg font-bold flex items-center">
                        <BsCheckCircle className="mr-2 text-green-500 animate-pulse" style={{ fontSize: '25px' }} />
                        ¡Venta Exitosa!
                    </h2>
                </div>
                <div className="modal-body">
                    <p>Tu venta ha sido procesada exitosamente.</p>
                </div>
            </div>
        </div>
    ) : null;
};

VentaExitosaModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default VentaExitosaModal;

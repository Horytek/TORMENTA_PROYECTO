import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './VentaExitosaModal.css';

const VentaExitosaModal = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            const timeout = setTimeout(() => {
                onClose();
                window.location.reload();
            }, 2400);
            return () => clearTimeout(timeout);
        }
    }, [isOpen, onClose]);

    return isOpen ? (
        <div className="fixed inset-0 flex items-center justify-center z-50 modal-container">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center modal-content-c">
                <div className="checkmark-container">
                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="checkmark-check" fill="none" d="M14 26l10 10 14-14" />
                    </svg>
                </div>
                <p className="text-xl font-semibold">Tu venta ha sido procesada exitosamente.</p>
            </div>
        </div>
    ) : null;
};

VentaExitosaModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default VentaExitosaModal;

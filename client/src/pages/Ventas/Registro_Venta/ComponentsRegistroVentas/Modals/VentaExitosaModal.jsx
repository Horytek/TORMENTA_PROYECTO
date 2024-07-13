import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { BsCheckCircle } from 'react-icons/bs';

const VentaExitosaModal = ({ isOpen, onClose }) => {
    useEffect(() => {
        let timeout;
        if (isOpen) {
            timeout = setTimeout(() => {
                onClose(); // Cierra el modal después de 1500 milisegundos (1.5 segundos)
                window.location.reload(); // Refresca la página después de cerrar el modal
            }, 1500);
        }

        return () => {
            clearTimeout(timeout);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
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
    );
};

VentaExitosaModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default VentaExitosaModal;

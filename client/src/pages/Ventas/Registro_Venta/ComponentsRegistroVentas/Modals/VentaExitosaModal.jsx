import { useEffect } from 'react';
import PropTypes from 'prop-types';

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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center flex flex-col items-center">
                <div className="flex items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-green-500 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="stroke-current text-green-300" cx="26" cy="26" r="25" fill="none" strokeWidth="2"/>
                        <path className="stroke-current text-green-500" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 26l10 10 14-14" />
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

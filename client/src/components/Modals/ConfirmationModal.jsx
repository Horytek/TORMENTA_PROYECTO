import PropTypes from 'prop-types';
import { Button } from '@nextui-org/react';

const ConfirmationModal = ({ message, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000]">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-[90%] text-center relative animate-fadeIn">
        <h2 className="text-2xl mb-4 text-blue-500 font-bold">Confirmación</h2>
        <p className="text-lg mb-6 text-gray-700">{message}</p>
        <div className="flex justify-center">
          <Button
            auto
            flat
            color="danger"
            variant="shadow"
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition mr-2"
          >
            Cerrar
          </Button>
          <Button
            auto
            color="success"
            variant="shadow"
            onClick={onConfirm}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
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
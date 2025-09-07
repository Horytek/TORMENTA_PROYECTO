// src/components/AlertModal/AlertModal.jsx

import PropTypes from 'prop-types';
import { Button } from '@heroui/react';

const AlertModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000]">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-[90%] text-center relative animate-fadeIn">
        <h2 className="text-2xl mb-4 text-red-600 font-bold">Error</h2>
        <p className="text-lg mb-6 text-gray-700">{message}</p>
        <Button
          variant="shadow"
          color="danger"
          onClick={onClose}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
};

AlertModal.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AlertModal;

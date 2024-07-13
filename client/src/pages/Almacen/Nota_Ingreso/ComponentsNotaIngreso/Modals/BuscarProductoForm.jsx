import React from 'react';
import { ButtonClose } from '@/components/Buttons/Buttons';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-3/4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Buscar producto</h2>
        </div>
        {children}
        <div className="flex justify-end mt-4">
          <ButtonClose onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export default Modal;
import React from 'react';
import { RiCloseLine } from "react-icons/ri";
import { FaCheck } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const ConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="content-modal">
        <div className="modal-header">
          <span className="modal-close" onClick={onClose}>
            <RiCloseLine style={{ fontSize: '24px' }} />
          </span>
        </div>
        <div className="modal-body text-center">
          <h2 className="modal-title text-xl font-bold mb-4">¿Desea imprimir esta nota?</h2>
          <p className="mb-6">Se imprimirá la nota: Nota</p>
          <div className="modal-buttons flex justify-center space-x-4">
            <button 
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
              onClick={onConfirm}
            >
              <FaCheck className='w-4 h-4 mr-1' />
              Si
            </button>
            <button 
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
              onClick={onClose}
            >
              <IoMdClose className='w-4 h-4 mr-1' />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

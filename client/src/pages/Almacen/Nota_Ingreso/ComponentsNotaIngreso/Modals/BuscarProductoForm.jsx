import React from 'react';
import { ButtonClose } from '@/components/Buttons/Buttons';
import './BuscarProductoForm.css';
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;



  return (
    <div className="modal-overlay">
      <div className="content-modal">
        <div className="modal-header">
          <h2 className="modal-title">Buscar producto</h2>
          <span className="modal-close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-buttons">
            
          <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
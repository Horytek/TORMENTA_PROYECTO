import React from 'react';
import './BuscarProductoForm.css';
import { RiCloseLargeLine } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;



  return (
    <div className="modal-overlay">
      <div className="content-modal">
        <div className="modal-header">
          <h2 className="modal-title">Buscar producto</h2>
          <button className="modal-close" onClick={onClose}>
              <IoMdClose className='text-3xl'/>
            </button>
        </div>
        <div className="modal-body">
          {children}
        </div>

            
<div className="modal-buttons flex justify-end mt-4">
          <button 
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={onClose}
          >
            <RiCloseLargeLine style={{ fontSize: '20px', marginRight: '8px' }} />
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default Modal;
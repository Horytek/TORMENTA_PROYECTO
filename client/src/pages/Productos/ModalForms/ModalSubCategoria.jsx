// import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ProductosForm.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

export const ModalSubCategoria = ({ modalTitle, closeModel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className='content-modal'>
                    <div className="modal-header">
                        <h3 className="modal-title">{modalTitle}</h3>
                        <button className="modal-close" onClick={closeModel}>
                            <IoMdClose className='text-3xl' />
                        </button>
                    </div>
                    <div className='modal-body'>
    
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="linea" className='text-sm font-bold text-black'>Línea:</label>
                            <select id='linea' className='w-full text-sm mb-2 bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                                <option>Seleccione...</option>
                            </select>
                            <label htmlFor="descripcion" className='text-sm font-bold text-black'>Nombre:</label>
                            <input type="text" name='marca' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5 text-sm' placeholder='Nombre de Sub-Línea' />
                        </div>
    
                        <div className='modal-buttons flex justify-between'>
                            <ButtonClose onClick={closeModel} />
                            <ButtonSave />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

ModalSubCategoria.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

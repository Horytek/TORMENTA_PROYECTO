// import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ProductosForm.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

export const ModalUndMed = ({ modalTitle, closeModel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{modalTitle}</h3>
                    <button className="modal-close" onClick={closeModel}>
                        <IoMdClose className='text-3xl' />
                    </button>
                </div>
                <div className='modal-body'>

                    <div className='w-full text-start mb-5'>
                        <label htmlFor="codigo" className='text-sm font-bold text-black'>Código:</label>
                        <input type="text" name='marca' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Cod. de unidad de medida' />
                    </div>

                    <div className='w-full text-start mb-5'>
                        <label htmlFor="umd" className='text-sm font-bold text-black'>UMD:</label>
                        <input type="text" name='marca' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Unidad de medida' />
                    </div>

                    <div className='w-full text-start mb-5'>
                        <label htmlFor="umd-sunat" className='text-sm font-bold text-black'>UMD SUNAT:</label>
                        <select id='umd-sunat' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                            <option>Seleccione...</option>
                        </select>
                    </div>

                    <div className='modal-buttons'>
                        <ButtonClose onClick={closeModel} />
                        <ButtonSave />
                    </div>
                </div>
            </div>
        </div>
    );
};

ModalUndMed.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

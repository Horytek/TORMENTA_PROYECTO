// import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ModalGuias.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

export const ModalTransportista = ({ modalTitle, closeModel }) => {
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
                            <label htmlFor="idtranspub" className='text-sm font-bold text-black'>Nuevo Código:</label>
                            <input type="text" name='idtranspub' className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='T0000006' disabled/>
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="ruc" className='text-sm font-bold text-black'>RUC:</label>
                            <input type="text" name='ruc' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='RUC del Transportista' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="empresa" className='text-sm font-bold text-black'>Empresa:</label>
                            <input type="text" name='empresa' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Empresa del Transportista' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="placa" className='text-sm font-bold text-black'>Placa:</label>
                            <input type="text" name='direc' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Placa del Transportista' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="telef" className='text-sm font-bold text-black'>Teléfono:</label>
                            <input type="text" name='telef' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Teléfono del Transportista' />
                        </div>
                        
                        <div className='modal-buttons'>
                            <ButtonClose onClick={closeModel} />
                            <ButtonSave />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

ModalTransportista.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

// import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ModalGuias.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

export const ModalTransporte = ({ modalTitle, closeModel }) => {
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
                            <label htmlFor="placa" className='text-sm font-bold text-black'>Placa:</label>
                            <input type="text" name='placa' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Placa de la unidad de transporte' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="inscripcion" className='text-sm font-bold text-black'>Inscripción:</label>
                            <input type="text" name='inscripcion' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Inscripción de la unidad de transporte' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="carreta" className='text-sm font-bold text-black'>Carreta:</label>
                            <input type="text" name='carreta' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Carreta de la unidad de transporte' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="telef" className='text-sm font-bold text-black'>Teléfono:</label>
                            <input type="text" name='telef' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Teléfono de la unidad de transporte' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="modelo" className='text-sm font-bold text-black'>Modelo:</label>
                            <input type="text" name='modelo' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Modelo de la unidad de transporte' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="marca" className='text-sm font-bold text-black'>Marca:</label>
                            <input type="text" name='marca' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' placeholder='Modelo de la unidad de transporte' />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="trans" className='text-sm font-bold text-black'>Transportista:</label>
                            <select id='trans' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                                <option>DOKY AGUIRRE.</option>
                            </select>
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

ModalTransporte.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

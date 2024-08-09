// import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ModalGuias.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import useCodigoData from '../../../data/generar_cod_trans';
import { FaRegPlusSquare } from "react-icons/fa";

import useVehiculoData from '../../../data/data_vehiculos_guia';

export const ModalTransportista = ({ modalTitle, closeModel }) => {
    const { codigos } = useCodigoData();

    const currentCod = codigos.length > 0 ? codigos[0].codtrans : '';

    const { vehiculos } = useVehiculoData();

    // Logica Modal Vehiculo


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
                            <input type="text"
                                name='idtranspub'
                                className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                                value={currentCod}
                                disabled />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="ruc" className='text-sm font-bold text-black'>RUC:</label>
                            <input type="text" name='ruc'
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                            />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="empresa" className='text-sm font-bold text-black'>Empresa:</label>
                            <input type="text" name='empresa'
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                            />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="placa" className='text-sm font-bold text-black'>Placa:</label>
                            <div className="flex items-center">
                                <select
                                    id='placa'
                                    name='placa'
                                    className={`w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2`}
                                >
                                    <option value="" >Seleccione...</option>
                                    {vehiculos.map(vehiculo => (
                                        <option key={vehiculo.placa} value={vehiculo.placa}>{vehiculo.placa}</option>
                                    ))}
                                </select>
                                <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500 ml-2' />
                            </div>

                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="telef" className='text-sm font-bold text-black'>Teléfono:</label>
                            <input type="text" name='telef'
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                            />
                        </div>
                        <div className='w-full text-start mb-5'>
                            <label htmlFor="trans" className='text-sm font-bold text-black'>Transportista:</label>
                            <select id='trans' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
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
        </div>
    );
};

ModalTransportista.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};


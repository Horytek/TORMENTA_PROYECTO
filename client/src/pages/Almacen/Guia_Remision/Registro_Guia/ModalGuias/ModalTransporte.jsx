import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ModalGuias.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { FaRegPlusSquare } from "react-icons/fa";
import useCodigoData from '../../../data/generar_cod_trans';
import ModalVehiculo from './ModalVehiculo'; // Importa el modal de vehículo

export const ModalTransporte = ({ modalTitle, closeModel }) => {
    const [isVehiculoModalOpen, setVehiculoModalOpen] = useState(false);

    const { codigos } = useCodigoData();
    const currentCod = codigos.length > 0 ? codigos[0].codtrans : '';

    const openVehiculoModal = () => setVehiculoModalOpen(true);
    const closeVehiculoModal = () => setVehiculoModalOpen(false);

    return (
        <>
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
                                <label htmlFor="placa" className='text-sm font-bold text-black'>Placa:</label>
                                <div className="flex items-center">
                                <input 
                                type="text" 
                                name='placa' 
                                className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1.5' 
                                
                                disabled/>
                                <FaRegPlusSquare 
                                    className='text-2xl cursor-pointer text-gray-500 ml-2'
                                    onClick={openVehiculoModal} // Abre el modal de vehículo al hacer clic
                                />
                                </div>
                                
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="dni" className='text-sm font-bold text-black'>DNI:</label>
                                <input type="text" name='dni' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' 
                                 />
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="apellidos" className='text-sm font-bold text-black'>Apellidos:</label>
                                <input type="text" name='apellidos' 
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' 
                                 />
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="nombres" className='text-sm font-bold text-black'>Nombres:</label>
                                <input type="text" name='nombres' 
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' 
                                />
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="telef" className='text-sm font-bold text-black'>Teléfono:</label>
                                <input type="text" name='telef' 
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' 
                                />
                            </div>
                            
        
                            <div className='modal-buttons'>
                                <ButtonClose onClick={closeModel} />
                                <ButtonSave />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {isVehiculoModalOpen && (
                <ModalVehiculo 
                    modalTitle="Nuevo Vehículo"
                    closeModel={closeVehiculoModal} // Pasa la función para cerrar el modal de vehículo
                />
            )}
        </>
    );
};

ModalTransporte.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ModalGuias.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { FaRegPlusSquare } from "react-icons/fa";
import useCodigoData from '../../../data/generar_cod_trans';
import useVehiculoData from '../../../data/data_vehiculos_guia';
import ModalVehiculo from './ModalVehiculo'; // Importa el modal de vehículo

export const ModalTransportista = ({ modalTitle, closeModel }) => {
    const { codigos } = useCodigoData();
    const [isVehiculoModalOpen, setVehiculoModalOpen] = useState(false);
    const [vehiculoPlaca, setVehiculoPlaca] = useState(''); // Estado para la placa del vehículo

    const currentCod = codigos.length > 0 ? codigos[0].codtrans : '';

    const openVehiculoModal = () => setVehiculoModalOpen(true);
    const closeVehiculoModal = () => setVehiculoModalOpen(false);

    // Función para actualizar la placa del vehículo
    const handlePlacaUpdate = (placa) => {
        setVehiculoPlaca(placa);
        closeVehiculoModal(); // Cierra el modal después de guardar el vehículo
    };

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
                                    <input 
                                        type="text" 
                                        name='placa' 
                                        className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1.5' 
                                        value={vehiculoPlaca} // Muestra la placa del vehículo
                                        disabled
                                    />
                                    <FaRegPlusSquare 
                                        className='text-2xl cursor-pointer text-gray-500 ml-2' 
                                        onClick={openVehiculoModal} // Abre el modal de vehículo al hacer clic
                                    />
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

            {isVehiculoModalOpen && (
                <ModalVehiculo 
                    modalTitle="Nuevo Vehículo"
                    closeModel={closeVehiculoModal} // Pasa la función para cerrar el modal de vehículo
                    onVehiculoSaved={handlePlacaUpdate} // Pasa la función para actualizar la placa
                />
            )}
        </>
    );
};

ModalTransportista.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

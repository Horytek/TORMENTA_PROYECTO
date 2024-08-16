import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../ModalGuias.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { FaRegPlusSquare } from "react-icons/fa";
import useCodigoData from '../../../data/generar_cod_trans';
import ModalVehiculo from './ModalVehiculo';
import addTransportistaPrivado from '../../../data/add_transportistapriv'; // Importa la función para añadir transportista
import toast from 'react-hot-toast';

export const ModalTransporte = ({ modalTitle, closeModel, onTransportistaAdded }) => {
    const { codigos } = useCodigoData();
    const [isVehiculoModalOpen, setVehiculoModalOpen] = useState(false);
    const [vehiculoPlaca, setVehiculoPlaca] = useState('');
    const [dni, setDni] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [nombres, setNombres] = useState('');
    const [telefono, setTelefono] = useState('');
    const [id, setId] = useState(''); // Estado para el ID

    useEffect(() => {
        if (codigos.length > 0) {
            setId(codigos[0].codtrans); // Establece el ID generado
        }
    }, [codigos]);

    const openVehiculoModal = () => setVehiculoModalOpen(true);
    const closeVehiculoModal = () => setVehiculoModalOpen(false);

    // Función para actualizar la placa del vehículo
    const handlePlacaUpdate = (placa) => {
        setVehiculoPlaca(placa);
        closeVehiculoModal();
    };

    const handleSave = async () => {
        const data = {
            id,
            placa: vehiculoPlaca,
            dni,
            apellidos,
            nombres,
            telefono
        };

        const result = await addTransportistaPrivado(data, closeModel);

        if (result.success) {
            toast.success('Transportista guardado con éxito');
            onTransportistaAdded(); // Llama a la función para actualizar la lista
        } else {
            toast.error(`Error al guardar el transportista: ${result.message}`);
        }
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
                                <label htmlFor="idtranspriv" className='text-sm font-bold text-black'>Nuevo Código:</label>
                                <input type="text"
                                    name='idtranspriv'
                                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                                    value={id}
                                    disabled />
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="dni" className='text-sm font-bold text-black'>DNI:</label>
                                <input 
                                    type="text" 
                                    name='dni'
                                    className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                />
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="apellidos" className='text-sm font-bold text-black'>Apellidos:</label>
                                <input 
                                    type="text" 
                                    name='apellidos'
                                    className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                                    value={apellidos}
                                    onChange={(e) => setApellidos(e.target.value)}
                                />
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="nombres" className='text-sm font-bold text-black'>Nombres:</label>
                                <input 
                                    type="text" 
                                    name='nombres'
                                    className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                                    value={nombres}
                                    onChange={(e) => setNombres(e.target.value)}
                                />
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="placa" className='text-sm font-bold text-black'>Placa (Opcional):</label>
                                <div className="flex items-center">
                                    <input 
                                        type="text" 
                                        name='placa' 
                                        className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1.5' 
                                        value={vehiculoPlaca}
                                        disabled
                                    />
                                    <FaRegPlusSquare 
                                        className='text-2xl cursor-pointer text-gray-500 ml-2' 
                                        onClick={openVehiculoModal}
                                    />
                                </div>
                            </div>
                            <div className='w-full text-start mb-5'>
                                <label htmlFor="telef" className='text-sm font-bold text-black'>Teléfono:</label>
                                <input 
                                    type="text" 
                                    name='telef'
                                    className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                />
                            </div>
                            <h4 className="mensaje">*Al registrar, cerrar y volver abrir el modal de Transporte*</h4>
                            <div className='modal-buttons'>
                                <ButtonClose onClick={closeModel} />
                                <ButtonSave onClick={handleSave} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isVehiculoModalOpen && (
                <ModalVehiculo 
                    modalTitle="Nuevo Vehículo"
                    closeModel={closeVehiculoModal} 
                    onVehiculoSaved={handlePlacaUpdate} 
                />
            )}
        </>
    );
};

ModalTransporte.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
    onTransportistaAdded: PropTypes.func.isRequired, // Añade esto
};

import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ModalGuias.css';
import { IoMdClose } from "react-icons/io";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { addVehiculo } from '../../../data/add_vehiculo';

export const ModalVehiculo = ({ modalTitle, closeModel, onVehiculoSaved }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
          placa: '',
          tipo: '',
        }
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            const { placa, tipo } = data;
            const newVehiculo = {
                placa: placa.toUpperCase().trim(),
                tipo: tipo.toUpperCase().trim(),
            };

            const result = await addVehiculo(newVehiculo, closeModel); // Llamada a la API para añadir el vehículo
            if (result.success) {
                toast.success(result.message);
                onVehiculoSaved(newVehiculo.placa); // Llama a la función para actualizar la placa
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error al añadir el vehículo");
        }
    });

    return (
        <form onSubmit={onSubmit}>
            <Toaster />
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
                                <input 
                                    {...register('placa', { required: true })}
                                    type="text" 
                                    name='placa' 
                                    className={`w-full bg-gray-50 ${errors.placa ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2 text-sm`}
                                    placeholder='Placa del Vehículo' 
                                />
                            </div>

                            <div className='w-full text-start mb-5'>
                                <label htmlFor="tipo" className='text-sm font-bold text-black'>Tipo:</label>
                                <input 
                                    {...register('tipo', { required: true })}
                                    type="text" 
                                    name='tipo' 
                                    className={`w-full bg-gray-50 ${errors.tipo ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2 text-sm`}
                                    placeholder='Tipo de Vehículo' 
                                />
                            </div>

                            <div className='modal-buttons flex justify-between'>
                                <ButtonClose onClick={closeModel} />
                                <ButtonSave type="submit"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

ModalVehiculo.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
    onVehiculoSaved: PropTypes.func.isRequired,
};

export default ModalVehiculo;

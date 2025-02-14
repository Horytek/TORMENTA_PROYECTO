import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { getSucursales, addAlmacen, updateAlmacen } from '@/services/almacen.services';
import '../Productos/ProductosForm.css';

const AlmacenForm = ({ modalTitle, onClose, initialData }) => {
    const [sucursales, setSucursales] = useState([]);
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: initialData?.data || {
            nom_almacen: '',
            id_sucursal: '',
            ubicacion: '',
            estado_almacen: '',
        }
    });

    useEffect(() => {
        fetchSucursales();
    }, []);

    useEffect(() => {
        if (initialData && sucursales.length > 0) {
            reset(initialData.data);
        }
    }, [initialData, sucursales, reset]);

    const fetchSucursales = async () => {
        const data = await getSucursales();
        setSucursales(data);
    };

    const onSubmit = handleSubmit(async (data) => {
        try {
            const { nom_almacen, id_sucursal, ubicacion, estado_almacen } = data;
            const newAlmacen = {
                nom_almacen,
                id_sucursal: id_sucursal ? parseInt(id_sucursal) : null,
                ubicacion,
                estado_almacen: parseInt(estado_almacen)
            };

            let result;
            if (initialData) {
                result = await updateAlmacen(parseInt(initialData?.data?.id_almacen), newAlmacen);
            } else {
                result = await addAlmacen(newAlmacen);
            }

            if (result) {
                onClose();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            toast.error("Error al gestionar el almacén");
        }
    });

    return (
        <div>
            <form onSubmit={onSubmit}>
                <Toaster />
                <div className="modal-overlay">
                    <div className="modal">
                        <div className='content-modal'>
                            <div className="modal-header">
                                <h3 className="modal-title">{modalTitle}</h3>
                                <button className="modal-close" onClick={onClose}>
                                    <IoMdClose className='text-3xl' />
                                </button>
                            </div>
                            <div className='modal-body'>
                                <div className='grid grid-cols-2 gap-6'>
                                    <div className='w-full relative group mb-5 text-start'>
                                        <label className='text-sm font-bold text-black'>Nombre Almacén:</label>
                                        <input
                                            {...register('nom_almacen', { required: true })}
                                            type="text"
                                            name='nom_almacen'
                                            className={`w-full bg-gray-50 ${errors.nom_almacen ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                                    </div>

                                    <div className='w-full relative group mb-5 text-start'>
                                        <label className='text-sm font-bold text-black'>Sucursal:</label>
                                        <select
                                            {...register('id_sucursal')}
                                            name='id_sucursal'
                                            className={`w-full text-sm bg-gray-50 ${errors.id_sucursal ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}
                                        >
                                            <option value="">Seleccione...</option>
                                            {sucursales.map((sucursal) => (
                                                <option
                                                    key={sucursal.id_sucursal}
                                                    value={sucursal.id_sucursal}
                                                >
                                                    {sucursal.nombre_sucursal} {initialData?.data?.id_sucursal === sucursal.id_sucursal ? "- (En uso)" : ""} - {sucursal.disponible ? "✅" : "❌"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className='grid grid-cols-2 gap-6'>
                                    <div className='w-full relative group mb-5 text-start'>
                                        <label className='text-sm font-bold text-black'>Ubicación:</label>
                                        <input
                                            {...register('ubicacion')}
                                            type="text"
                                            name='ubicacion'
                                            className={`w-full bg-gray-50 ${errors.ubicacion ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                                    </div>
                                    <div className='w-full relative group mb-5 text-start'>
                                        <label className='text-sm font-bold text-black'>Estado:</label>
                                        <select
                                            {...register('estado_almacen', { required: true })}
                                            name='estado_almacen'
                                            className={`w-full text-sm bg-gray-50 ${errors.estado_almacen ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                                            <option value="">Seleccione...</option>
                                            <option value={1}>Activo</option>
                                            <option value={0}>Inactivo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className='modal-buttons'>
                                    <ButtonClose onClick={onClose} />
                                    <ButtonSave type="submit" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

AlmacenForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    initialData: PropTypes.object
};

export default AlmacenForm;

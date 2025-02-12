import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { addRol, updateRol } from '@/services/rol.services';
import '../Productos/ProductosForm.css';

const ProductosForm = ({ modalTitle, onClose, initialData }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: initialData?.data || {
            nom_rol: '',
            estado_rol: '',
        }
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData.data);
        }
    }, [initialData, reset]);

    const onSubmit = handleSubmit(async (data) => {
        try {
            const {nom_rol, estado_rol } = data;
            const newUser = {
                nom_rol,
                estado_rol: parseInt(estado_rol)
            };
            
            let result;
            if (initialData) {
                result = await updateRol(initialData?.id_rol, newUser); 
            } else {
                result = await addRol(newUser); 
            }

            if (result) {
                onClose();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            toast.error("Error al realizar la gestión del rol");
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
                                    <IoMdClose className='text-3xl'/>
                                </button>
                            </div>
                            <div className='modal-body'>
                                <div className='grid grid-cols-2 gap-6'>
                                    <div className='w-full relative group mb-5 text-start'>
                                        <label className='text-sm font-bold text-black'>Rol:</label>
                                        <input 
                                                {...register('nom_rol', { required: true })}
                                                type="text"
                                                name='nom_rol'
                                                className={`w-full bg-gray-50 ${errors.nom_rol ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                                    </div>
                                    <div className='w-full relative group mb-5 text-start'>
                                        <label className='text-sm font-bold text-black'>Estado:</label>
                                        <select 
                                            {...register('estado_rol', { required: true })}
                                            name='estado_rol'
                                            className={`w-full text-sm bg-gray-50 ${errors.estado_rol ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                                            <option value="">Seleccione...</option>
                                            <option value={1}>Activo</option>
                                            <option value={0}>Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                                <div className='modal-buttons'>
                                    <ButtonClose onClick={onClose}/>
                                    <ButtonSave type="submit"/>
                                </div>
                            </div>
                        </div>
                    </div> 
                </div>
            </form>
        </div>
    );
};

ProductosForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    initialData: PropTypes.object
};

export default ProductosForm;

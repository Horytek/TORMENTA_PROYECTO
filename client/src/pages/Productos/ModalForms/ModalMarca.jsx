// import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ProductosForm.css';
import { IoMdClose } from "react-icons/io";
import { useMarcas } from '@/context/Marca/MarcaProvider';
import { Toaster, toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

export const ModalMarca = ({ modalTitle, closeModel }) => {

    // Consumir context de marca
    const { createMarca } = useMarcas();

    // Registro de marca
    const { register, handleSubmit, formState: {errors} } = useForm({
        defaultValues: {
          nom_marca: '',
        }
    });

    const onSubmit = handleSubmit( async (data) => {
        try {
          const { nom_marca } = data;
          const newMarca = {
            nom_marca: nom_marca.toUpperCase().trim(),
            estado_marca: 1
          };
  
          const result = await createMarca(newMarca); // Llamada a la API para añadir la marca
          if (result) {
            closeModel(); // Cerrar modal
          }
          
        } catch (error) {
          toast.error("Error al realizar la gestión de la marca");
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
                                <label htmlFor="nom_marca" className='text-sm font-bold text-black'>Marca:</label>
                                <input 
                                {...register('nom_marca', 
                                    { required: true }
                                )}
                                type="text" 
                                name='nom_marca' 
                                className={`w-full bg-gray-50 ${errors.nom_marca ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2 text-sm`}
                                placeholder='Nombre de Marca' />
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

ModalMarca.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

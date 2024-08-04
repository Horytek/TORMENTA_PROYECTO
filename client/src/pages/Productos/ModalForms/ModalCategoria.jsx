// import { useState } from 'react';
import PropTypes from 'prop-types';
import '../ProductosForm.css';
import { IoMdClose } from "react-icons/io";
import { useCategorias } from '@/context/Categoria/CategoriaProvider';
import { Toaster, toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

export const ModalCategoria = ({ modalTitle, closeModel }) => {

    // Consumir context de categoría
    const { createCategoria } = useCategorias();

    // Registro de categoria
    const { register, handleSubmit, formState: {errors} } = useForm({
        defaultValues: {
          nom_categoria: '',
        }
    });

    const onSubmit = handleSubmit( async (data) => {
        try {
          const { nom_categoria } = data;
          const newCategoria = {
            nom_categoria: nom_categoria.toUpperCase().trim(),
            estado_categoria: 1
          };
  
          const result = await createCategoria(newCategoria); // Llamada a la API para añadir la categoría
          if (result) {
            closeModel(); // Cerrar modal
          }
          
        } catch (error) {
          toast.error("Error al realizar la gestión de la categoría");
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
                                <label htmlFor="descripcion" className='text-sm font-bold text-black'>Nombre:</label>
                                <input 
                                {...register('nom_categoria', 
                                    { required: true }
                                )}
                                type="text" 
                                name='nom_categoria' 
                                className={`w-full bg-gray-50 ${errors.nom_categoria ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2 text-sm`}
                                placeholder='Nombre de Línea' />
                            </div>
        
                            <div className='modal-buttons flex justify-between'>
                                <ButtonClose onClick={closeModel} />
                                <ButtonSave />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

ModalCategoria.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

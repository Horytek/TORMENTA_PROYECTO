/* eslint-disable react-hooks/exhaustive-deps */
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import '../ProductosForm.css';
import { IoMdClose } from "react-icons/io";
import { useSubcategorias } from '@/context/Subcategoria/SubcategoriaProvider';
import { useCategorias } from '@/context/Categoria/CategoriaProvider';
import { Toaster, toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

export const ModalSubCategoria = ({ modalTitle, closeModel }) => {

    // Consumir context de subcategoria y categoria
    const { createSubcategoria } = useSubcategorias();
    const { categorias, loadCategorias } = useCategorias();
    useEffect(() => {
        loadCategorias();
    },[]);

    // Registro de subcategoria
    const { register, handleSubmit, formState: {errors} } = useForm({
        defaultValues: {
          id_categoria: '',
          nom_subcat: ''
        }
    });

    const onSubmit = handleSubmit( async (data) => {
        try {
          const { id_categoria, nom_subcat } = data;
          const newSubcategoria = {
            id_categoria: parseInt(id_categoria),
            nom_subcat: nom_subcat.toUpperCase().trim(),
            estado_subcat: 1
          };
  
          const result = await createSubcategoria(newSubcategoria); // Llamada a la API para añadir el producto
          if (result) {
            closeModel(); // Cerrar modal
          }
          
        } catch (error) {
          toast.error("Error al realizar la gestión de la subcategoría");
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
                                <label htmlFor="categoria" className='text-sm font-bold text-black'>Categoría:</label>
                                <select 
                                {...register('id_categoria', 
                                    { required: true }
                                )}
                                name='id_categoria'
                                className={`w-full text-sm bg-gray-50 ${errors.id_categoria ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border text-sm p-2`}>
                                    <option value="">Seleccione...</option>
                                    {categorias.length > 0 && categorias.map((categoria, index) => (
                                        <option key={index} value={categoria.id_categoria}>
                                        {categoria.nom_categoria.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                <label htmlFor="nom_subcat" className='text-sm font-bold text-black'>Subcategoría:</label>
                                <input
                                {...register('nom_subcat', 
                                    { required: true }
                                )}
                                type="text" 
                                name='nom_subcat' 
                                className={`w-full bg-gray-50 ${errors.nom_subcat ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2 text-sm`}
                                placeholder='Nombre de Sub-Línea' />
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

ModalSubCategoria.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    closeModel: PropTypes.func.isRequired,
};

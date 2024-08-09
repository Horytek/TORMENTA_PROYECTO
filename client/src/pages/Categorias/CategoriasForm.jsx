import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { useCategorias } from '@/context/Categoria/CategoriaProvider';

const CategoriasForm = ({ modalTitle, onClose }) => {
    const { createCategoria, loadCategorias } = useCategorias();

    // Initialize form with react-hook-form
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            nom_categoria: '',
        }
    });

    const onSubmit = handleSubmit(async (data) => {
        try {
            const newCategory = {
                nom_categoria: data.nom_categoria,
            };

            const result = await createCategoria(newCategory);

            // Close modal and reload categories
            if (result) {
                toast.success('Categoría registrada exitosamente');
                onClose();
                loadCategorias(); // Optionally reload categories
            }

        } catch (error) {
            toast.error("Error al registrar la categoría");
        }
    });

    return (
        <div>
            <form onSubmit={onSubmit}>
                <Toaster />
                <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div className="modal" style={{ width: "400px" }}>
                        <div className='content-modal'>
                            <div className="modal-header">
                                <h3 className="modal-title">{modalTitle}</h3>
                                <button className="modal-close" onClick={onClose}>
                                    <IoMdClose className='text-3xl' />
                                </button>
                            </div>
                            <div className='modal-body'>

                                {/* Category Name Field */}
                                <div className='w-full text-start mb-5'>
                                    <label htmlFor="nom_categoria" className='text-sm font-bold text-black mb-3' style={{ display: 'block', marginBottom: '10px' }}>Nombre de Categoría:</label>
                                    <input
                                        {...register('nom_categoria', 
                                            { required: true }
                                        )}
                                        name="nom_categoria"
                                        className={`block w-full text-sm border rounded-lg ${errors.nom_categoria ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-gray-300'} bg-gray-50 text-gray-900`}
                                        placeholder="Ingrese el nombre de la categoría"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className='modal-buttons' style={{ gap: "30px", marginTop: "30px" }}>
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

CategoriasForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default CategoriasForm;

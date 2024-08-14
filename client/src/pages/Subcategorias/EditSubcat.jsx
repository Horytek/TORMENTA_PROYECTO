import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { useSubcategorias } from "@/context/Subcategoria/SubcategoriaProvider";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";
import useEditSubCategoria from "./hooks/editFunc";

const EditForm = ({ isOpen, onClose, initialData, modalTitle }) => {
  const { editSubCategoria, loading } = useEditSubCategoria();
  const { categorias, loadCategorias } = useCategorias();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (initialData) {
      setValue("nom_categoria", initialData.nom_categoria);
      setValue("nom_subcat", initialData.nom_subcat);
      setValue("estado_subcat", initialData.estado_subcat);
    }
    loadCategorias();
  }, [initialData, setValue, loadCategorias]);

  const onSubmit = async (data) => {
    try {
      const updatedData = {
        ...data,
        estado_subcat: parseInt(data.estado_subcat, 10),
      };
      await editSubCategoria(updatedData);
      toast.success("Subcategoría actualizada con éxito");
      onClose();
    } catch (error) {
      toast.error("Error al actualizar la subcategoría");
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Toaster />
      <div className="modal-overlay">
        <div className="modal w-96 h-auto">
          <div className="content-modal">
            <div className="modal-header">
              <h3 className="modal-title">{modalTitle}</h3>
              <button type="button" className="modal-close" onClick={onClose}>
                <IoMdClose className="text-3xl" />
              </button>
            </div>
            <div className="modal-body">
              <div className="w-full text-start mb-5">
                <label htmlFor="nom_categoria" className="text-sm font-bold text-black">
                  Categoría:
                </label>
                <select
                  {...register("nom_categoria", { required: true })}
                  id="nom_categoria"
                  className={`w-full text-sm bg-gray-50 ${
                    errors.nom_categoria
                      ? "border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500"
                      : "border-gray-300"
                  } text-gray-900 rounded-lg border p-2`}
                >
                  <option value="">Seleccione...</option>
                  {categorias.length > 0 &&
                    categorias.map((categoria) => (
                      <option
                        key={categoria.id_categoria}
                        value={categoria.nom_categoria}
                      >
                        {categoria.nom_categoria.toUpperCase()}
                      </option>
                    ))}
                </select>
                {errors.nom_categoria && (
                  <p className="text-red-600 text-sm mt-1">
                    Selecciona una categoría.
                  </p>
                )}

                <label
                  htmlFor="nom_subcat"
                  className="text-sm font-bold text-black mt-4 block"
                >
                  Subcategoría:
                </label>
                <input
                  {...register("nom_subcat", { required: true })}
                  type="text"
                  id="nom_subcat"
                  className={`w-full bg-gray-50 ${
                    errors.nom_subcat
                      ? "border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500"
                      : "border-gray-300"
                  } text-gray-900 rounded-lg border p-2 text-sm`}
                  placeholder="Nombre de Subcategoría"
                />
                {errors.nom_subcat && (
                  <p className="text-red-600 text-sm mt-1">
                    Ingrese una subcategoría.
                  </p>
                )}

                <label
                  htmlFor="estado_subcat"
                  className="text-sm font-bold text-black mt-4 block"
                >
                  Estado de la Subcategoría:
                </label>
                <select
                  {...register("estado_subcat", { required: true })}
                  id="estado_subcat"
                  className={`w-full text-sm bg-gray-50 ${
                    errors.estado_subcat
                      ? "border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500"
                      : "border-gray-300"
                  } text-gray-900 rounded-lg border p-2`}
                >
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
                {errors.estado_subcat && (
                  <p className="text-red-600 text-sm mt-1">
                    Selecciona un estado.
                  </p>
                )}
              </div>

              <div className="modal-buttons flex justify-between">
                <ButtonClose onClick={onClose} />
                <ButtonSave loading={loading} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

EditForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  modalTitle: PropTypes.string.isRequired,
};

export default EditForm;

import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";
import useEditCat from "./hook/editFunc";

const EditForm = ({ isOpen, onClose, initialData, modalTitle }) => {
  const { editCat, loading } = useEditCat();
  const { loadCategorias } = useCategorias();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (initialData) {
      setValue("nom_categoria", initialData.nom_categoria);
      setValue("estado_categoria", initialData.estado_categoria);
    }
    if (!initialData) {
      loadCategorias();
    }
  }, [initialData, setValue]);

  const onSubmit = async (data) => {
    try {
      const updatedData = {
        ...data,
        id_categoria: initialData.id_categoria,
        estado_categoria: parseInt(data.estado_categoria, 10),
      };
      await editCat(updatedData);
      toast.success("Categoría actualizada con éxito");
      setTimeout(() => {
        window.location.reload();
      }, 420);
      onClose();
    } catch (error) {
      // console.error("Error al actualizar la subcategoría");
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
                <label
                  htmlFor="nom_categoria"
                  className="text-sm font-bold text-black mt-4 block"
                >
                  Categoría:
                </label>
                <input
                  {...register("nom_categoria", { required: true })}
                  type="text"
                  id="nom_categoria"
                  className={`w-full bg-gray-50 ${
                    errors.nom_categoria
                      ? "border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500"
                      : "border-gray-300"
                  } text-gray-900 rounded-lg border p-2 text-sm`}
                  placeholder="Nombre de Subcategoría"
                />
                {errors.nom_categoria && (
                  <p className="text-red-600 text-sm mt-1">
                    Ingrese una categoria.
                  </p>
                )}

                <label
                  htmlFor="estado_categoria"
                  className="text-sm font-bold text-black mt-4 block"
                >
                  Estado de la categoria:
                </label>
                <select
                  {...register("estado_categoria", { required: true })}
                  id="estado_categoria"
                  className={`w-full text-sm bg-gray-50 ${
                    errors.estado_categoria
                      ? "border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500"
                      : "border-gray-300"
                  } text-gray-900 rounded-lg border p-2`}
                >
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
                {errors.estado_categoria && (
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

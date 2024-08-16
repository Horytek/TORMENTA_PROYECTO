import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { useForm } from "react-hook-form";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { useMarcas } from "@/context/Marca/MarcaProvider";
import { toast } from "react-hot-toast";
import useEditMarca from "./hook/editFunc";

const EditForm = ({ isOpen, onClose, initialData, modalTitle }) => {
  const { editMarca, loading } = useEditMarca();
  const { loadMarcas } = useMarcas();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (initialData) {
      setValue("nom_marca", initialData.nom_marca);
      setValue("estado_marca", initialData.estado_marca);
    }
    if (!initialData) {
      loadMarcas();
    }
  }, [initialData, setValue]);

  const onSubmit = async (data) => {
    try {
      const updatedData = {
        ...data,
        id_marca: initialData.id_marca,
        estado_marca: parseInt(data.estado_marca, 10),
      };
      await editMarca(updatedData);
      onClose();
      toast.success("Marca actualizada con éxito");
      setTimeout(() => {
        window.location.reload();
      }
      , 420);
    } catch (error) {
      toast.error("Error al actualizar la marca");
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
                  htmlFor="nom_marca"
                  className="text-sm font-bold text-black mt-4 block"
                >
                  Marca:
                </label>
                <input
                  {...register("nom_marca", { required: true })}
                  type="text"
                  id="nom_marca"
                  className={`w-full bg-gray-50 ${
                    errors.nom_marca
                      ? "border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500"
                      : "border-gray-300"
                  } text-gray-900 rounded-lg border p-2 text-sm`}
                  placeholder="Nombre de marca"
                />
                {errors.nom_marca && (
                  <p className="text-red-600 text-sm mt-1">
                    Ingrese una marca.
                  </p>
                )}

                <label
                  htmlFor="estado_marca"
                  className="text-sm font-bold text-black mt-4 block"
                >
                  Estado de la marca:
                </label>
                <select
                  {...register("estado_marca", { required: true })}
                  id="estado_marca"
                  className={`w-full text-sm bg-gray-50 ${
                    errors.estado_marca
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

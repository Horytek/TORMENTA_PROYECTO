import PropTypes from "prop-types";
import { useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { useSubcategorias } from "@/context/Subcategoria/SubcategoriaProvider";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";
import { Toaster, toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";

const SubcategoriaForm = ({ modalTitle, closeModal }) => {
  const { createSubcategoria } = useSubcategorias();
  const { categorias, loadCategorias } = useCategorias();

  useEffect(() => {
    loadCategorias();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      id_categoria: "",
      nom_subcat: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { id_categoria, nom_subcat } = data;
      const newSubcategoria = {
        id_categoria: parseInt(id_categoria, 10),
        nom_subcat: nom_subcat.toUpperCase().trim(),
        estado_subcat: 1,
      };

      const result = await createSubcategoria(newSubcategoria);
      if (result) {
        closeModal();
      }
    } catch (error) {
      toast.error("Error al realizar la gestión de la subcategoría");
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Toaster />
      <div className="modal-overlay">
        <div className="modal w-96 h-96">
          {" "}
          <div className="content-modal">
            <div className="modal-header">
              <h3 className="modal-title">{modalTitle}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                <IoMdClose className="text-3xl" />
              </button>
            </div>
            <div className="modal-body">
              <div className="w-full text-start mb-5">
                <label
                  htmlFor="categoria"
                  className="text-sm font-bold text-black"
                >
                  Categoría:
                </label>
                <select
                  {...register("id_categoria", { required: true })}
                  name="id_categoria"
                  id="categoria"
                  className={`w-full text-sm bg-gray-50 ${
                    errors.id_categoria
                      ? "border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500"
                      : "border-gray-300"
                  } text-gray-900 rounded-lg border p-2`}
                >
                  <option value="">Seleccione...</option>
                  {categorias.length > 0 &&
                    categorias.map((categoria) => (
                      <option
                        key={categoria.id_categoria}
                        value={categoria.id_categoria}
                      >
                        {categoria.nom_categoria.toUpperCase()}
                      </option>
                    ))}
                </select>
                {errors.id_categoria && (
                  <p className="text-red-600 text-sm mt-1">
                    Selecciona una categoria.
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
                  name="nom_subcat"
                  id="nom_subcat"
                  className={`w-full bg-gray-50 ${
                    errors.nom_subcat
                      ? "border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500"
                      : "border-gray-300"
                  } text-gray-900 rounded-lg border p-2 text-sm`}
                  placeholder="Nombre de Sub-categoria"
                />
                {errors.nom_subcat && (
                  <p className="text-red-600 text-sm mt-1">
                    Ingrese una subcategoría.
                  </p>
                )}
              </div>

              <div className="modal-buttons flex justify-between">
                <ButtonClose onClick={closeModal} />
                <ButtonSave />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

SubcategoriaForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  closeModal: PropTypes.func.isRequired,
};

export default SubcategoriaForm;

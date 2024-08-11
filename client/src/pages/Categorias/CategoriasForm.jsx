import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { useForm } from "react-hook-form";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";

const CategoriasForm = ({ modalTitle, onClose }) => {
  const { createCategoria } = useCategorias();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nom_categoria: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { nom_categoria } = data;
      const newCategory = {
        nom_categoria: nom_categoria.toUpperCase().trim(),
        estado_categoria: 1,
      };

      const result = await createCategoria(newCategory);

      if (result) {
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 550);
      }
    } catch (error) {
      console.error("Error al realizar la gestión de la categoría");
    }
  });

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div
          className="modal-overlay"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <div className="modal" style={{ width: "400px" }}>
            <div className="content-modal">
              <div className="modal-header">
                <h3 className="modal-title">{modalTitle}</h3>
                <button className="modal-close" onClick={onClose}>
                  <IoMdClose className="text-3xl" />
                </button>
              </div>
              <div className="modal-body">
                <div className="w-full text-start mb-5">
                  <label
                    htmlFor="nom_categoria"
                    className="text-sm font-bold text-black mb-3"
                    style={{ display: "block", marginBottom: "10px" }}
                  >
                    Nombre de Categoría:
                  </label>
                  <input
                    {...register("nom_categoria", { required: true })}
                    name="nom_categoria"
                    className={`block w-full text-sm border rounded-lg ${
                      errors.nom_categoria
                        ? "border-red-600 focus:border-red-600 focus:ring-red-600"
                        : "border-gray-300"
                    } bg-gray-50 text-gray-900`}
                    placeholder="Ingrese el nombre de la categoría"
                  />
                  {errors.nom_categoria && (
                    <span className="text-xs text-red-600">
                      Este campo es obligatorio
                    </span>
                  )}
                </div>

                <div
                  className="modal-buttons"
                  style={{ gap: "30px", marginTop: "30px" }}
                >
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

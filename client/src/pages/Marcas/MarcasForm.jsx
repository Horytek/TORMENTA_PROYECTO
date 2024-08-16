import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { useForm } from "react-hook-form";
import { useMarcas } from "@/context/Marca/MarcaProvider";

const MarcasForm = ({ modalTitle, onClose }) => {
  const { createMarca} = useMarcas();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nom_marca: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { nom_marca } = data;
      const newMarca = {
        nom_marca: nom_marca.toUpperCase().trim(),
        estado_marca: 1
      };

      const result = await createMarca(newMarca);

      if (result) {
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 550);
      }
    
    } catch (error) {
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
                    htmlFor="nom_marca"
                    className="text-sm font-bold text-black mb-3"
                    style={{ display: "block", marginBottom: "10px" }}
                  >
                    Nombre de marca:
                  </label>
                  <input
                    {...register("nom_marca", { required: true })}
                    name="nom_marca"
                    className={`block w-full text-sm border rounded-lg ${
                      errors.nom_marca
                        ? "border-red-600 focus:border-red-600 focus:ring-red-600"
                        : "border-gray-300"
                    } bg-gray-50 text-gray-900`}
                    placeholder="Ingrese el nombre de la marca"
                  />
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

MarcasForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MarcasForm;

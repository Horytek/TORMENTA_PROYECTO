import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { useForm } from "react-hook-form";
import { Input, Checkbox } from "@nextui-org/react";

export const AddFeatureModal = ({ isOpen, onClose, handleAddFeature }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      funcion: "",
      estado_funcion: true,
    }
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    reset(); // Asegura que el formulario se limpie al cerrar
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    await handleAddFeature(data);
    handleClose();
  });

  return (
    <div className={`modal-overlay ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} transition-opacity duration-300`}>
      <div className="modal">
        <div className="content-modal">
          <div className="modal-header">
            <h3 className="modal-title">Agregar Característica</h3>
            <button className="modal-close" onClick={handleClose}>
              <IoMdClose className="text-3xl" />
            </button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="w-full relative group mb-5 text-start">
                <label className="text-sm font-bold text-black">Nombre de la característica:</label>
                <Input
                  {...register("funcion", { required: true })}
                  placeholder="Nueva característica..."
                  style={{
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                  }}
                  className={`w-full ${errors.funcion ? "border-red-600 focus:border-red-600 focus:ring-red-600" : "border-gray-300"} text-gray-900 rounded-lg`}
                />
              </div>
              <div className="w-full relative group mb-5 text-start">
                <Checkbox {...register("estado_funcion")} defaultSelected>
                  Activo
                </Checkbox>
              </div>
            </div>
            <div className="modal-buttons">
              <ButtonClose onClick={handleClose} />
              <ButtonSave type="submit" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

AddFeatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  handleAddFeature: PropTypes.func.isRequired,
};

// -------------------------------------------

export const EditFeatureModal = ({ isOpen, onClose, selectedFeature, handleEditFeature }) => {
  const [funcion, setFuncion] = useState("");
  const [estadoFuncion, setEstadoFuncion] = useState(true);

  useEffect(() => {
    if (isOpen && selectedFeature) {
      setFuncion(selectedFeature.funcion);
      setEstadoFuncion(selectedFeature.estado_funcion === 1);
    }
  }, [isOpen, selectedFeature]);

  const handleClose = () => {
    setFuncion("");
    setEstadoFuncion(true);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleEditFeature({
      funcion,
      estado_funcion: estadoFuncion ? 1 : 0
    });
    handleClose();
  };

  return (
    <div className={`modal-overlay ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} transition-opacity duration-300`}>
      <div className="modal">
        <div className="content-modal">
          <div className="modal-header">
            <h3 className="modal-title">Editar Característica</h3>
            <button className="modal-close" onClick={handleClose}>
              <IoMdClose className="text-3xl" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="w-full relative group mb-5 text-start">
                <label className="text-sm font-bold text-black">Nombre de la característica:</label>
                <Input
                  value={funcion}
                  onChange={(e) => setFuncion(e.target.value)}
                  placeholder="Nombre de la característica..."
                  style={{
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                  }}
                  className={`w-full ${!funcion ? "border-red-600 focus:border-red-600 focus:ring-red-600" : "border-gray-300"} text-gray-900 rounded-lg`}
                />
              </div>
              <div className="w-full relative group mb-5 text-start">
                <Checkbox
                  isSelected={estadoFuncion}
                  onChange={(e) => setEstadoFuncion(e.target.checked)}
                >
                  Activo
                </Checkbox>
              </div>
            </div>
            <div className="modal-buttons">
              <ButtonClose onClick={handleClose} />
              <ButtonSave type="submit" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

EditFeatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedFeature: PropTypes.object,
  handleEditFeature: PropTypes.func.isRequired,
};
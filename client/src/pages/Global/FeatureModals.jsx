import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { useForm } from "react-hook-form";
import { Input, Checkbox } from "@heroui/react";

// Modal base reutilizable
function ModalBase({ isOpen, onClose, title, children }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-blue-100/60 dark:border-zinc-700/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100/40 dark:border-zinc-700/40 bg-gradient-to-r from-blue-50/60 via-white/80 to-blue-100/60 dark:from-zinc-900/80 dark:via-zinc-900/90 dark:to-zinc-900/80 rounded-t-2xl">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">{title}</h3>
          <button
            className="rounded-full p-1 hover:bg-blue-100 dark:hover:bg-zinc-800 transition"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            <IoMdClose className="text-2xl text-blue-400 dark:text-blue-200" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

ModalBase.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

// ---------------------- AGREGAR ----------------------

export const AddFeatureModal = ({ isOpen, onClose, handleAddFeature }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      funcion: "",
      estado_funcion: true,
    },
  });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    await handleAddFeature(data);
    handleClose();
  });

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} title="Agregar Característica">
      <form onSubmit={onSubmit} autoComplete="off">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Nombre de la característica
            </label>
            <Input
              {...register("funcion", { required: true })}
              placeholder="Nueva característica..."
              className={`w-full ${
                errors.funcion
                  ? "border-red-600 focus:border-red-600 focus:ring-red-600"
                  : "border-blue-200 dark:border-zinc-700"
              } text-blue-900 dark:text-blue-100 rounded-lg`}
              autoFocus
            />
            {errors.funcion && (
              <span className="text-xs text-red-600 mt-1 block">Este campo es obligatorio</span>
            )}
          </div>
          <div>
            <Checkbox {...register("estado_funcion")} defaultSelected>
              Activo
            </Checkbox>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-8">
          <ButtonClose onClick={handleClose} />
          <ButtonSave type="submit" />
        </div>
      </form>
    </ModalBase>
  );
};

AddFeatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  handleAddFeature: PropTypes.func.isRequired,
};

// ---------------------- EDITAR ----------------------

export const EditFeatureModal = ({
  isOpen,
  onClose,
  selectedFeature,
  handleEditFeature,
}) => {
  const [funcion, setFuncion] = useState("");
  const [estadoFuncion, setEstadoFuncion] = useState(true);

  useEffect(() => {
    if (isOpen && selectedFeature) {
      setFuncion(selectedFeature.funcion || "");
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
    if (!funcion) return;
    await handleEditFeature({
      funcion,
      estado_funcion: estadoFuncion ? 1 : 0,
    });
    handleClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} title="Editar Característica">
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Nombre de la característica
            </label>
            <Input
              value={funcion}
              onChange={(e) => setFuncion(e.target.value)}
              placeholder="Nombre de la característica..."
              className={`w-full ${
                !funcion
                  ? "border-red-600 focus:border-red-600 focus:ring-red-600"
                  : "border-blue-200 dark:border-zinc-700"
              } text-blue-900 dark:text-blue-100 rounded-lg`}
              autoFocus
            />
            {!funcion && (
              <span className="text-xs text-red-600 mt-1 block">Este campo es obligatorio</span>
            )}
          </div>
          <div>
            <Checkbox
              isSelected={estadoFuncion}
              onChange={(e) => setEstadoFuncion(e.target.checked)}
            >
              Activo
            </Checkbox>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-8">
          <ButtonClose onClick={handleClose} />
          <ButtonSave type="submit" />
        </div>
      </form>
    </ModalBase>
  );
};

EditFeatureModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedFeature: PropTypes.object,
  handleEditFeature: PropTypes.func.isRequired,
};

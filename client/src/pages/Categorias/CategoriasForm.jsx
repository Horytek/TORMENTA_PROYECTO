import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@heroui/react";

const CategoriasForm = ({ modalTitle, onClose, onSuccess }) => {
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

      if (result && result.id_categoria) {
        if (onSuccess) onSuccess({ ...newCategory, id_categoria: result.id_categoria });
        onClose();
      }
    } catch (error) {
      // Manejo de error opcional
    }
  });

  return (
    <Modal isOpen={true} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-bold">{modalTitle}</h3>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={onSubmit}>
            <div className="w-full mb-5">
              <Input
                {...register("nom_categoria", { required: true })}
                label="Nombre de Categoría"
                color={errors.nom_categoria ? "danger" : "default"}
                errorMessage={
                  errors.nom_categoria && "Este campo es obligatorio"
                }
                isRequired
              />
            </div>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button color="primary" type="submit">
                Guardar
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

CategoriasForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default CategoriasForm;
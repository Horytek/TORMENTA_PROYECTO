import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@heroui/react";
import { Select, SelectItem } from "@nextui-org/react";
import { IoMdClose } from "react-icons/io";
import useEditCat from "./hook/editFunc";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";

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
      // Configurar valores iniciales en el formulario
      setValue("nom_categoria", initialData.nom_categoria || "");
      setValue("estado_categoria", initialData.estado_categoria?.toString() || "1");
    } else {
      loadCategorias();
    }
  }, [initialData, setValue, loadCategorias]);

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
      toast.error("Error al actualizar la categoría");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-bold">{modalTitle}</h3>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Nombre de la categoría */}
              <Input
                {...register("nom_categoria", { required: true })}
                label="Nombre de la categoría"
                defaultValue={initialData?.nom_categoria || ""}
                color={errors.nom_categoria ? "danger" : "default"}
                errorMessage={
                  errors.nom_categoria && "Este campo es obligatorio"
                }
                isRequired
              />

              {/* Estado de la categoría */}
              <Select
                {...register("estado_categoria", { required: true })}
                label="Estado de la categoría"
                placeholder="Seleccione un estado"
                defaultValue={initialData?.estado_categoria?.toString() || "1"}
                color={errors.estado_categoria ? "danger" : "default"}
                errorMessage={
                  errors.estado_categoria && "Seleccione un estado"
                }
                isRequired
              >
                <SelectItem key="1" value="1">
                  Activo
                </SelectItem>
                <SelectItem key="0" value="0">
                  Inactivo
                </SelectItem>
              </Select>
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
              <Button color="primary" type="submit" isLoading={loading}>
                Guardar
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

EditForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  modalTitle: PropTypes.string.isRequired,
};

export default EditForm;
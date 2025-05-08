import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "react-hot-toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@heroui/react";
import {
    Select,
    SelectItem
  } from "@nextui-org/react";
import { IoMdClose } from "react-icons/io";
import useEditSubCategoria from "./hooks/editFunc";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";

const EditForm = ({ isOpen, onClose, initialData, modalTitle }) => {
  const { editSubCategoria, loading } = useEditSubCategoria();
  const { categorias, loadCategorias } = useCategorias();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  useEffect(() => {
    if (initialData && categorias.length > 0) {
      const selectedCategoria = categorias.find(
        (categoria) => categoria.nom_categoria === initialData.nom_categoria
      );
      if (selectedCategoria) {
        setValue("id_categoria", selectedCategoria.id_categoria);
      }
      setValue("nom_subcat", initialData.nom_subcat);
      setValue("estado_subcat", initialData.estado_subcat?.toString());
    }
  }, [initialData, categorias, setValue]);

  const onSubmit = async (data) => {
    try {
      const updatedData = {
        ...data,
        id_subcategoria: initialData.id_subcategoria,
        estado_subcat: parseInt(data.estado_subcat, 10),
      };
      await editSubCategoria(updatedData);
      toast.success("Subcategoría actualizada con éxito");
      onClose();
    } catch (error) {
      toast.error("Error al actualizar la subcategoría");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-bold">{modalTitle}</h3>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 transition-colors"
            onClick={onClose}
          >
            <IoMdClose className="text-2xl" />
          </button>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Categoría */}
            <Select
              {...register("id_categoria", { required: "Seleccione una categoría" })}
              label="Categoría"
              placeholder="Seleccione una categoría"
              color={errors.id_categoria ? "danger" : "default"}
              errorMessage={errors.id_categoria?.message}
              isRequired
            >
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nom_categoria.toUpperCase()}
                </SelectItem>
              ))}
            </Select>

            {/* Subcategoría */}
            <Input
              {...register("nom_subcat", { required: "Ingrese una subcategoría" })}
              label="Subcategoría"
              placeholder="Nombre de la subcategoría"
              defaultValue={initialData?.nom_subcat || ""}
              color={errors.nom_subcat ? "danger" : "default"}
              errorMessage={errors.nom_subcat?.message}
              isRequired
            />

            {/* Estado */}
            <Select
              {...register("estado_subcat", { required: "Seleccione un estado" })}
              label="Estado de la Subcategoría"
              placeholder="Seleccione un estado"
              color={errors.estado_subcat ? "danger" : "default"}
              errorMessage={errors.estado_subcat?.message}
              isRequired
            >
              <SelectItem key="1" value="1">
                Activo
              </SelectItem>
              <SelectItem key="0" value="0">
                Inactivo
              </SelectItem>
            </Select>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            className="mr-2"
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
          >
            Guardar
          </Button>
        </ModalFooter>
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
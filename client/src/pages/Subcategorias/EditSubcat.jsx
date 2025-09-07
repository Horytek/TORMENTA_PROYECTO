import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm, Controller } from "react-hook-form";
import { Toaster, toast } from "react-hot-toast";
import {
  Input,
  Button,
} from "@heroui/react";
import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Select,
  SelectItem
} from '@heroui/react';
import { IoMdClose } from "react-icons/io";

const EditForm = ({ isOpen, onClose, initialData, modalTitle, onSuccess, categorias }) => {
const {
  control,
  handleSubmit,
  setValue,
  formState: { errors },
  reset
} = useForm({
  defaultValues: {
    id_categoria: "",
    nom_subcat: "",
    estado_subcat: "1",
  }
});

useEffect(() => {
  if (initialData && categorias.length > 0) {
    reset({
      id_categoria: initialData.id_categoria?.toString() || "",
      nom_subcat: initialData.nom_subcat || "",
      estado_subcat: initialData.estado_subcat?.toString() || "1",
    });
  }
}, [initialData, categorias, reset]);

  const onSubmit = async (data) => {
    try {
const categoriaObj = categorias.find(
  c => String(c.id_categoria) === String(data.id_categoria)
);

const updatedData = {
  ...data,
  id_subcategoria: initialData.id_subcategoria,
  estado_subcat: parseInt(data.estado_subcat, 10),
  nom_categoria: categoriaObj ? categoriaObj.nom_categoria : "",
  estado_categoria: categoriaObj ? categoriaObj.estado_categoria : 1,
};
      const ok = await onSuccess(updatedData);
      if (ok) {
        toast.success("Subcategoría actualizada con éxito");
        onClose();
      }
    } catch (error) {
      toast.error("Error al actualizar la subcategoría");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Toaster />
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-bold">{modalTitle}</h3>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Categoría */}
<Controller
  name="id_categoria"
  control={control}
  rules={{ required: "Seleccione una categoría" }}
  render={({ field }) => (
    <Select
      {...field}
      label="Categoría"
      placeholder="Seleccione una categoría"
      color={errors.id_categoria ? "danger" : "default"}
      errorMessage={errors.id_categoria?.message}
      isRequired
      selectedKeys={field.value ? [String(field.value)] : []}
      onChange={e => field.onChange(e.target.value)}
    >
      {categorias.map((categoria) => (
        <SelectItem
          key={categoria.id_categoria.toString()}
          value={categoria.id_categoria.toString()}
        >
          {categoria.nom_categoria.toUpperCase()}
        </SelectItem>
      ))}
    </Select>
  )}
/>

            {/* Subcategoría */}
            <Controller
              name="nom_subcat"
              control={control}
              rules={{ required: "Ingrese una subcategoría" }}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Subcategoría"
                  placeholder="Nombre de la subcategoría"
                  color={errors.nom_subcat ? "danger" : "default"}
                  errorMessage={errors.nom_subcat?.message}
                  isRequired
                />
              )}
            />

            {/* Estado */}
            <Controller
              name="estado_subcat"
              control={control}
              rules={{ required: "Seleccione un estado" }}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Estado de la Subcategoría"
                  placeholder="Seleccione un estado"
                  color={errors.estado_subcat ? "danger" : "default"}
                  errorMessage={errors.estado_subcat?.message}
                  isRequired
                  selectedKeys={field.value ? [String(field.value)] : []}
                  onChange={e => field.onChange(e.target.value)}
                >
                  <SelectItem key="1" value="1">
                    Activo
                  </SelectItem>
                  <SelectItem key="0" value="0">
                    Inactivo
                  </SelectItem>
                </Select>
              )}
            />
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
  onSuccess: PropTypes.func.isRequired,
  categorias: PropTypes.array.isRequired,
};

export default EditForm;
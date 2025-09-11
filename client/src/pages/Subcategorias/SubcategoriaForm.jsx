import PropTypes from "prop-types";
import { IoMdClose } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
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

const SubcategoriaForm = ({ modalTitle, closeModal, onSuccess, categorias = [] }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      id_categoria: "",
      nom_subcat: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const { id_categoria, nom_subcat } = data;
      const newSubcategoria = {
        id_categoria: parseInt(id_categoria, 10),
        nom_subcat: nom_subcat.toUpperCase().trim(),
        estado_subcat: 1,
      };

      const ok = await onSuccess(newSubcategoria);
      if (ok) {
        toast.success("Subcategoría creada con éxito");
        reset();
        closeModal();
      }
    } catch (error) {
      toast.error("Error al realizar la gestión de la subcategoría");
    }
  };

  return (
    <Modal isOpen={true} onClose={closeModal} size="sm">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-bold">{modalTitle}</h3>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 transition-colors"
            onClick={closeModal}
          >
            <IoMdClose className="text-2xl" />
          </button>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Categoría */}
            {categorias.length === 0 ? (
              <div className="text-red-500 text-sm">No hay categorías disponibles.</div>
            ) : (
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
                      <SelectItem key={categoria.id_categoria} value={categoria.id_categoria}>
                        {categoria.nom_categoria.toUpperCase()}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            )}

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
          </form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={closeModal}
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

SubcategoriaForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  closeModal: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  categorias: PropTypes.array.isRequired,
};

export default SubcategoriaForm;
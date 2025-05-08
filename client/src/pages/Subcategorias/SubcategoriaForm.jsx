import PropTypes from "prop-types";
import { useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { useSubcategorias } from "@/context/Subcategoria/SubcategoriaProvider";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";
import { Toaster, toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
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
} from "@nextui-org/react";
const SubcategoriaForm = ({ modalTitle, closeModal }) => {
  const { createSubcategoria } = useSubcategorias();
  const { categorias, loadCategorias } = useCategorias();

  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

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
        toast.success("Subcategoría creada con éxito");
        closeModal();
      }
    } catch (error) {
      toast.error("Error al realizar la gestión de la subcategoría");
    }
  });

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
          <form onSubmit={onSubmit} className="space-y-4">
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
              color={errors.nom_subcat ? "danger" : "default"}
              errorMessage={errors.nom_subcat?.message}
              isRequired
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
};

export default SubcategoriaForm;
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useCategorias } from '@/context/Categoria/CategoriaProvider';
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Input,
  Button
} from "@heroui/react";

export const ModalCategoria = ({ modalTitle, closeModel }) => {
  const [isOpen, setIsOpen] = useState(true);
  // Consumir context de categoría
  const { createCategoria } = useCategorias();

  // Registro de categoria
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      nom_categoria: '',
    }
  });

  const handleCloseModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      closeModel();
    }, 300);
  };

  const onSubmit = async (data) => {
    try {
      const { nom_categoria } = data;
      const newCategoria = {
        nom_categoria: nom_categoria.toUpperCase().trim(),
        estado_categoria: 1
      };

      const result = await createCategoria(newCategoria); // Llamada a la API para añadir la categoría
      if (result) {
        toast.success("Categoría creada correctamente");
        handleCloseModal(); // Cerrar modal
      }
    } catch (error) {
      toast.error("Error al realizar la gestión de la categoría");
    }
  };

  return (
    <>
      <Toaster />
      <Modal 
        isOpen={isOpen} 
        onClose={handleCloseModal}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {modalTitle}
              </ModalHeader>
              <ModalBody>
                <Controller
                  name="nom_categoria"
                  control={control}
                  rules={{ required: "El nombre de la categoría es requerido" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Nombre"
                      variant="bordered"
                      placeholder="Nombre de Categoría"
                      color={errors.nom_categoria ? "danger" : "default"}
                      errorMessage={errors.nom_categoria?.message}
                      isRequired
                    />
                  )}
                />
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={handleCloseModal}
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
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

ModalCategoria.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  closeModel: PropTypes.func.isRequired,
};

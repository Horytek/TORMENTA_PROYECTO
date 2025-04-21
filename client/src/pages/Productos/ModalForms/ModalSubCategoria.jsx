/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSubcategorias } from '@/context/Subcategoria/SubcategoriaProvider';
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
  Select,
  SelectItem,
  Button
} from "@nextui-org/react";

export const ModalSubCategoria = ({ modalTitle, closeModel }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Consumir context de subcategoria y categoria
  const { createSubcategoria } = useSubcategorias();
  const { categorias, loadCategorias } = useCategorias();
  
  useEffect(() => {
    loadCategorias();
  }, []);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      id_categoria: '',
      nom_subcat: ''
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
      const { id_categoria, nom_subcat } = data;
      const newSubcategoria = {
        id_categoria: parseInt(id_categoria),
        nom_subcat: nom_subcat.toUpperCase().trim(),
        estado_subcat: 1
      };

      const result = await createSubcategoria(newSubcategoria);
      if (result) {
        toast.success("Subcategoría creada correctamente");
        handleCloseModal();
      }
    } catch (error) {
      toast.error("Error al crear la subcategoría");
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
                <div className="space-y-4">
                  <Controller
                    name="id_categoria"
                    control={control}
                    rules={{ required: "La categoría es requerida" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Categoría"
                        placeholder="Seleccione una categoría"
                        variant="bordered"
                        color={errors.id_categoria ? "danger" : "default"}
                        errorMessage={errors.id_categoria?.message}
                        isRequired
                        selectedKeys={field.value ? [field.value.toString()] : []}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id_categoria.toString()} value={categoria.id_categoria.toString()}>
                            {categoria.nom_categoria.toUpperCase()}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  <Controller
                    name="nom_subcat"
                    control={control}
                    rules={{ required: "El nombre de la subcategoría es requerido" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Subcategoría"
                        variant="bordered"
                        placeholder="Nombre de subcategoría"
                        color={errors.nom_subcat ? "danger" : "default"}
                        errorMessage={errors.nom_subcat?.message}
                        isRequired
                      />
                    )}
                  />
                </div>
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

ModalSubCategoria.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  closeModel: PropTypes.func.isRequired,
};

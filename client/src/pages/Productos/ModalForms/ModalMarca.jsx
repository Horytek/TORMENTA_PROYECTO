import { useState } from 'react';
import PropTypes from 'prop-types';
import { useMarcas } from '@/context/Marca/MarcaProvider';
import { toast } from "react-hot-toast";
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

export const ModalMarca = ({ modalTitle, closeModel }) => {
  const [isOpen, setIsOpen] = useState(true);
  // Consumir context de marca
  const { createMarca } = useMarcas();

  // Registro de marca
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      nom_marca: '',
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
      const { nom_marca } = data;
      const newMarca = {
        nom_marca: nom_marca.toUpperCase().trim(),
        estado_marca: 1
      };

      const result = await createMarca(newMarca); // Llamada a la API para añadir la marca
      if (result) {
        toast.success("Marca creada correctamente");
        handleCloseModal(); // Cerrar modal
      }
    } catch (error) {
      toast.error("Error al realizar la gestión de la marca");
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        size="md"
        classNames={{
          backdrop: "z-[10020] bg-slate-900/40 backdrop-blur-md",
          wrapper: "z-[10021] overflow-hidden",
          base: "z-[10022] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden",
          header: "border-b border-slate-100 dark:border-zinc-800 py-3 px-6 bg-white dark:bg-zinc-900",
          body: "py-6 px-6",
          footer: "border-t border-slate-100 dark:border-zinc-800 py-3 px-6 bg-slate-50/50 dark:bg-zinc-900/50 backdrop-blur-sm"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {modalTitle}
              </ModalHeader>
              <ModalBody>
                <Controller
                  name="nom_marca"
                  control={control}
                  rules={{ required: "El nombre de la marca es requerido" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Marca"
                      variant="faded"
                      placeholder="Nombre de Marca"
                      color={errors.nom_marca ? "danger" : "default"}
                      errorMessage={errors.nom_marca?.message}
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

ModalMarca.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  closeModel: PropTypes.func.isRequired,
};

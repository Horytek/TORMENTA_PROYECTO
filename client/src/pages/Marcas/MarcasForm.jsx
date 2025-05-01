import { useState, useEffect } from 'react';                // ← add useEffect
import PropTypes from 'prop-types';
import { useMarcas } from '@/context/Marca/MarcaProvider';
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
} from "@nextui-org/react";

export const MarcasForm = ({ modalTitle, onClose, isVisible }) => {
  // control internal animation state by mirroring parent prop
  const [isOpen, setIsOpen] = useState(isVisible);

  useEffect(() => {
    setIsOpen(isVisible);
  }, [isVisible]);

  const { createMarca } = useMarcas();
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { nom_marca: '' }
  });

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const onSubmit = async data => {
    try {
      const newMarca = {
        nom_marca: data.nom_marca.toUpperCase().trim(),
        estado_marca: 1
      };
      const result = await createMarca(newMarca);
      if (result) {
        handleCloseModal();
      }
    } catch {
      toast.error("Error al realizar la gestión de la marca");
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        size="md"
      >
        <ModalContent>
          {/* remove the render‐prop param to avoid shadowing */}
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
                    variant="bordered"
                    placeholder="Nombre de Marca"
                    color={errors.nom_marca ? "danger" : "default"}
                    errorMessage={errors.nom_marca?.message}
                    isRequired
                  />
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleCloseModal}>
                Cancelar
              </Button>
              <Button color="primary" onPress={handleSubmit(onSubmit)}>
                Guardar
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
};

MarcasForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose:    PropTypes.func.isRequired,
  isVisible:  PropTypes.bool.isRequired,
};

export default MarcasForm;

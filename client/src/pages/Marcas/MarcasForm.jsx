import { useState } from 'react';
import PropTypes from "prop-types";
import { useForm, Controller } from "react-hook-form";
import { useMarcas } from "@/context/Marca/MarcaProvider";
import { Toaster, toast } from "react-hot-toast";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Input,
  Button
} from "@nextui-org/react";

const MarcasForm = ({ modalTitle, onClose }) => {
  const { createMarca } = useMarcas();
  const [isOpen, setIsOpen] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nom_marca: "",
    },
  });

  const handleCloseModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const onSubmit = async (data) => {
    try {
      const { nom_marca } = data;
      const newMarca = {
        nom_marca: nom_marca.toUpperCase().trim(),
        estado_marca: 1
      };

      const result = await createMarca(newMarca);

      if (result) {
        toast.success("Marca creada correctamente");
        handleCloseModal();
        setTimeout(() => {
          window.location.reload();
        }, 550);
      }
    } catch (error) {
      toast.error("Error al crear la marca");
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
                  name="nom_marca"
                  control={control}
                  rules={{ required: "El nombre de la marca es requerido" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Nombre de marca"
                      variant="bordered"
                      placeholder="Ingrese el nombre de la marca"
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

MarcasForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MarcasForm;

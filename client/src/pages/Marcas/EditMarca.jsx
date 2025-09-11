import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useForm, Controller } from "react-hook-form";
import { Toaster, toast } from "react-hot-toast";
import { 
  Input,
  Button,
  Spinner
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
import {
  updateMarca
} from "@/services/marca.services";

const EditForm = ({ isOpen, onClose, initialData, modalTitle, onMarcaEdit }) => {
  const { editMarca, loading } = updateMarca();
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nom_marca: "",
      estado_marca: "1"
    }
  });

  useEffect(() => {
    if (initialData) {
      setValue("nom_marca", initialData.nom_marca);
      setValue("estado_marca", initialData.estado_marca?.toString() || "1");
    }
    setIsModalOpen(isOpen);
  }, [initialData, setValue, isOpen]);
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

const onSubmit = async (data) => {
  try {
    const updatedData = {
      ...data,
      id_marca: initialData.id_marca,
      estado_marca: parseInt(data.estado_marca, 10),
    };
    const success = await editMarca(updatedData);
    if (success) {
      if (onMarcaEdit) onMarcaEdit(updatedData); 
      toast.success("Marca actualizada con éxito");
      handleCloseModal();
    } else {
      toast.error("Ocurrió un error al actualizar la marca");
    }
  } catch (error) {
    toast.error("Error al actualizar la marca");
  }
};


  return (
    <>
      <Toaster />
      <Modal 
        isOpen={isModalOpen} 
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
                    name="nom_marca"
                    control={control}
                    rules={{ required: "Ingrese una marca" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Marca"
                        variant="bordered"
                        placeholder="Nombre de marca"
                        color={errors.nom_marca ? "danger" : "default"}
                        errorMessage={errors.nom_marca?.message}
                        isRequired
                      />
                    )}
                  />

                  <Controller
                    name="estado_marca"
                    control={control}
                    rules={{ required: "Selecciona un estado" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Estado de la marca"
                        variant="bordered"
                        placeholder="Seleccione un estado"
                        selectedKeys={field.value ? [field.value.toString()] : []}
                        onChange={(e) => field.onChange(e.target.value)}
                        color={errors.estado_marca ? "danger" : "default"}
                        errorMessage={errors.estado_marca?.message}
                        isRequired
                      >
                        <SelectItem key="1" value="1">Activo</SelectItem>
                        <SelectItem key="0" value="0">Inactivo</SelectItem>
                      </Select>
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
                  isLoading={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

EditForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  modalTitle: PropTypes.string.isRequired,
  onMarcaEdit: PropTypes.func,
};

export default EditForm;

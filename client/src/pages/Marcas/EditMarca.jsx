import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-hot-toast";
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
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="md"
        backdrop="blur"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md z-[10005]",
          wrapper: "z-[10006]",
          base: "z-[10007] rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl",
          header: "border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 py-4 px-6",
          body: "py-6 px-6",
          footer: "border-t border-slate-100 dark:border-zinc-800 py-4 px-6 bg-slate-50/30 dark:bg-zinc-900/10"
        }}
        motionProps={{
          variants: {
            enter: { y: 0, opacity: 1, scale: 1 },
            exit: { y: 10, opacity: 0, scale: 0.98 }
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-xl font-bold text-slate-800 dark:text-white">{modalTitle}</span>
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
                        variant="flat"
                        labelPlacement="outside"
                        placeholder="Nombre de marca"
                        classNames={{
                          inputWrapper: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                          input: "text-slate-800 dark:text-slate-200",
                          label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                        }}
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
                        variant="flat"
                        labelPlacement="outside"
                        placeholder="Seleccione un estado"
                        classNames={{
                          trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                          value: "text-slate-800 dark:text-slate-200",
                          label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                        }}
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
              <ModalFooter className="flex justify-end gap-3 mt-4">
                <Button
                  variant="flat"
                  className="bg-slate-100 text-slate-600 font-bold dark:bg-zinc-800 dark:text-slate-300 rounded-xl px-4"
                  onPress={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 rounded-xl px-4"
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

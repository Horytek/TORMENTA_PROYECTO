import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
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
import { useEditCat } from '@/services/categoria.services';

const EditForm = ({ isOpen, onClose, initialData, modalTitle, onSuccess }) => {
  // Elimina el hook que llama API: const { editCat, loading } = useEditCat();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (initialData) {
      setValue("nom_categoria", initialData.nom_categoria || "");
      setValue("estado_categoria", initialData.estado_categoria?.toString() || "1");
    }
  }, [initialData, setValue]);

  const onSubmit = async (data) => {
    try {
      const updatedData = {
        ...data,
        id_categoria: initialData.id_categoria,
        estado_categoria: parseInt(data.estado_categoria, 10),
      };
      // Ya no llamamos a la API aquí.
      if (onSuccess) await onSuccess(updatedData); // padre hará la API y actualizará el estado local
      toast.success("Categoría actualizada con éxito");
      onClose();
    } catch (error) {
      toast.error("Error al actualizar la categoría");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
        <ModalHeader className="flex flex-col gap-1">
          <span className="text-xl font-bold text-slate-800 dark:text-white">{modalTitle}</span>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                {...register("nom_categoria", { required: true })}
                label="Nombre de la categoría"
                variant="flat"
                labelPlacement="outside"
                defaultValue={initialData?.nom_categoria || ""}
                classNames={{
                  inputWrapper: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                  input: "text-slate-800 dark:text-slate-200",
                  label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                }}
                color={errors.nom_categoria ? "danger" : "default"}
                errorMessage={errors.nom_categoria && "Este campo es obligatorio"}
                isRequired
              />
              <Select
                {...register("estado_categoria", { required: true })}
                label="Estado de la categoría"
                variant="flat"
                labelPlacement="outside"
                placeholder="Seleccione un estado"
                classNames={{
                  trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                  value: "text-slate-800 dark:text-slate-200",
                  label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                }}
                defaultValue={initialData?.estado_categoria?.toString() || "1"}
                color={errors.estado_categoria ? "danger" : "default"}
                errorMessage={errors.estado_categoria && "Seleccione un estado"}
                isRequired
              >
                <SelectItem key="1" value="1">Activo</SelectItem>
                <SelectItem key="0" value="0">Inactivo</SelectItem>
              </Select>
            </div>
            <ModalFooter className="flex justify-end gap-3 mt-4">
              <Button
                variant="flat"
                className="bg-slate-100 text-slate-600 font-bold dark:bg-zinc-800 dark:text-slate-300 rounded-xl px-4"
                onPress={onClose}
              >
                Cancelar
              </Button>
              <Button
                className="bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 rounded-xl px-4"
                type="submit"
              >
                Guardar
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

EditForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  modalTitle: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
};

export default EditForm;
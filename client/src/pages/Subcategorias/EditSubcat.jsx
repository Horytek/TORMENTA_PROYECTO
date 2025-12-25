import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useForm, Controller } from "react-hook-form";
import { Toaster, toast } from "react-hot-toast";
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
import { IoMdClose } from "react-icons/io";

const EditForm = ({ isOpen, onClose, initialData, modalTitle, onSuccess, categorias }) => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      id_categoria: "",
      nom_subcat: "",
      estado_subcat: "1",
    }
  });

  useEffect(() => {
    if (initialData && categorias.length > 0) {
      reset({
        id_categoria: initialData.id_categoria?.toString() || "",
        nom_subcat: initialData.nom_subcat || "",
        estado_subcat: initialData.estado_subcat?.toString() || "1",
      });
    }
  }, [initialData, categorias, reset]);

  const onSubmit = async (data) => {
    try {
      const categoriaObj = categorias.find(
        c => String(c.id_categoria) === String(data.id_categoria)
      );

      const updatedData = {
        ...data,
        id_subcategoria: initialData.id_subcategoria,
        estado_subcat: parseInt(data.estado_subcat, 10),
        nom_categoria: categoriaObj ? categoriaObj.nom_categoria : "",
        estado_categoria: categoriaObj ? categoriaObj.estado_categoria : 1,
      };
      const ok = await onSuccess(updatedData);
      if (ok) {
        toast.success("Subcategoría actualizada con éxito");
        onClose();
      }
    } catch (error) {
      toast.error("Error al actualizar la subcategoría");
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
      <Toaster />
      <ModalContent>
        <ModalHeader>
          <span className="text-xl font-bold text-slate-800 dark:text-white">{modalTitle}</span>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Categoría */}
            <Controller
              name="id_categoria"
              control={control}
              rules={{ required: "Seleccione una categoría" }}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Categoría"
                  variant="flat"
                  labelPlacement="outside"
                  placeholder="Seleccione una categoría"
                  classNames={{
                    trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                    value: "text-slate-800 dark:text-slate-200",
                    label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                  }}
                  color={errors.id_categoria ? "danger" : "default"}
                  errorMessage={errors.id_categoria?.message}
                  isRequired
                  selectedKeys={field.value ? [String(field.value)] : []}
                  onChange={e => field.onChange(e.target.value)}
                >
                  {categorias.map((categoria) => (
                    <SelectItem
                      key={categoria.id_categoria.toString()}
                      value={categoria.id_categoria.toString()}
                    >
                      {categoria.nom_categoria.toUpperCase()}
                    </SelectItem>
                  ))}
                </Select>
              )}
            />

            {/* Subcategoría */}
            <Controller
              name="nom_subcat"
              control={control}
              rules={{ required: "Ingrese una subcategoría" }}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Subcategoría"
                  variant="flat"
                  labelPlacement="outside"
                  placeholder="Nombre de la subcategoría"
                  classNames={{
                    inputWrapper: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                    input: "text-slate-800 dark:text-slate-200",
                    label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                  }}
                  color={errors.nom_subcat ? "danger" : "default"}
                  errorMessage={errors.nom_subcat?.message}
                  isRequired
                />
              )}
            />

            {/* Estado */}
            <Controller
              name="estado_subcat"
              control={control}
              rules={{ required: "Seleccione un estado" }}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Estado de la Subcategoría"
                  variant="flat"
                  labelPlacement="outside"
                  placeholder="Seleccione un estado"
                  classNames={{
                    trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                    value: "text-slate-800 dark:text-slate-200",
                    label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                  }}
                  color={errors.estado_subcat ? "danger" : "default"}
                  errorMessage={errors.estado_subcat?.message}
                  isRequired
                  selectedKeys={field.value ? [String(field.value)] : []}
                  onChange={e => field.onChange(e.target.value)}
                >
                  <SelectItem key="1" value="1">
                    Activo
                  </SelectItem>
                  <SelectItem key="0" value="0">
                    Inactivo
                  </SelectItem>
                </Select>
              )}
            />
          </form>
        </ModalBody>
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
            onPress={handleSubmit(onSubmit)}
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

EditForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  modalTitle: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  categorias: PropTypes.array.isRequired,
};

export default EditForm;
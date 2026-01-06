// Ajustar Select para asegurar claves string y prevenir problemas de selección.
import PropTypes from "prop-types";
import { toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
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
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";

const SubcategoriaForm = ({ modalTitle, closeModal, onSuccess, categorias = [] }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      id_categoria: "",
      nom_subcat: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const { id_categoria, nom_subcat } = data;
      const newSubcategoria = {
        id_categoria: parseInt(id_categoria, 10),
        nom_subcat: nom_subcat.toUpperCase().trim(),
        estado_subcat: 1,
      };

      const ok = await onSuccess(newSubcategoria);
      if (ok) {
        toast.success("Subcategoría creada con éxito");
        reset();
        closeModal();
      }
    } catch {
      toast.error("Error al realizar la gestión de la subcategoría");
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {categorias.length === 0 ? (
              <div className="text-red-500 text-sm">No hay categorías disponibles.</div>
            ) : (
              <Controller
                name="id_categoria"
                control={control}
                rules={{ required: "Seleccione una categoría" }}
                render={({ field }) => (
                  <Select
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
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      field.onChange(val);
                    }}
                  >
                    {categorias.map((categoria) => (
                      <SelectItem
                        key={String(categoria.id_categoria)}
                        value={String(categoria.id_categoria)}
                      >
                        {categoria.nom_categoria.toUpperCase()}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            )}

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
          </form>
        </ModalBody>
        <ModalFooter className="flex justify-end gap-3 mt-4">
          <ButtonClose onPress={closeModal} />
          <ButtonSave onPress={handleSubmit(onSubmit)} />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

SubcategoriaForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  closeModal: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  categorias: PropTypes.array.isRequired,
};

export default SubcategoriaForm;
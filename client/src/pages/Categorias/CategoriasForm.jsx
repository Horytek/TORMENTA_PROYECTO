import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { useCategorias } from "@/context/Categoria/CategoriaProvider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@heroui/react";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";

const CategoriasForm = ({ modalTitle, onClose, onSuccess }) => {
  const { createCategoria } = useCategorias();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nom_categoria: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { nom_categoria } = data;
      const newCategory = {
        nom_categoria: nom_categoria.toUpperCase().trim(),
        estado_categoria: 1,
      };

      const result = await createCategoria(newCategory);

      // result es [true, id_categoria] si fue exitoso
      if (Array.isArray(result) && result[0] && result[1]) {
        if (onSuccess) onSuccess({ ...newCategory, id_categoria: result[1] });
        onClose();
      }
    } catch (error) {
      // Manejo de error opcional
    }
  });

  return (
    <Modal
      isOpen={true}
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
          <form onSubmit={onSubmit}>
            <div className="w-full mb-5">
              <Input
                {...register("nom_categoria", { required: true })}
                label="Nombre de Categoría"
                variant="flat"
                labelPlacement="outside"
                placeholder="Nombre de categoria"
                classNames={{
                  inputWrapper: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                  input: "text-slate-800 dark:text-slate-200",
                  label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                }}
                color={errors.nom_categoria ? "danger" : "default"}
                errorMessage={
                  errors.nom_categoria && "Este campo es obligatorio"
                }
                isRequired
              />
            </div>
            <ModalFooter className="flex justify-end gap-3 mt-4">
              <ButtonClose onPress={onClose} />
              <ButtonSave type="submit" />
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

CategoriasForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default CategoriasForm;
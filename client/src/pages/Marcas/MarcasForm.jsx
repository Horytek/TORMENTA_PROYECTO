import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";

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
} from "@heroui/react";

export const MarcasForm = ({ modalTitle, onClose, isVisible, onAddMarca }) => {
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
      if (result && result[0]) {
        // result[1] es el id generado por la BD
        const marcaConId = { ...newMarca, id_marca: result[1] };
        if (onAddMarca) onAddMarca(marcaConId);
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
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-xl font-bold text-slate-800 dark:text-white">{modalTitle}</span>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Controller
                    name="nom_marca"
                    control={control}
                    rules={{ required: "El nombre de la marca es requerido" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Marca"
                        variant="flat"
                        labelPlacement="outside"
                        placeholder="Nombre de Marca"
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
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-3 mt-4">
                <ButtonClose onPress={handleCloseModal} />
                <ButtonSave onPress={handleSubmit(onSubmit)} />
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
  isVisible: PropTypes.bool.isRequired,
  onAddMarca: PropTypes.func,
};

export default MarcasForm;

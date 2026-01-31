import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { updateTalla } from "@/services/talla.services";
import { toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from "@heroui/react";

const EditTalla = ({ modalTitle, onClose, isOpen, initialData, onTallaEdit }) => {
    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            nombre: initialData?.nombre || '',
            orden: initialData?.orden || 0
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                nombre: initialData.nombre,
                orden: initialData.orden || 0
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (data) => {
        try {
            const updatedTalla = {
                nombre: data.nombre.trim(),
                orden: Number(data.orden) || 0
            };
            const result = await updateTalla(initialData.id_talla, updatedTalla);
            if (result && result.code === 1) {
                if (onTallaEdit) onTallaEdit({ ...updatedTalla, id_talla: initialData.id_talla });
                toast.success("Talla actualizada");
                onClose();
            } else {
                toast.error("Error actualizando talla");
            }
        } catch (error) {
            toast.error("Error al actualizar la talla");
            console.error(error);
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
                base: "z-[10007] rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl"
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
                                    name="nombre"
                                    control={control}
                                    rules={{ required: "El nombre es requerido" }}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            label="Nombre"
                                            variant="flat"
                                            labelPlacement="outside"
                                            placeholder="Nombre de Talla"
                                            isRequired
                                            errorMessage={errors.nombre?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name="orden"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="number"
                                            label="Orden"
                                            variant="flat"
                                            labelPlacement="outside"
                                        />
                                    )}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter className="flex justify-end gap-3 mt-4">
                            <ButtonClose onPress={onClose} />
                            <ButtonSave onPress={handleSubmit(onSubmit)} />
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

EditTalla.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    initialData: PropTypes.object,
    onTallaEdit: PropTypes.func
};

export default EditTalla;

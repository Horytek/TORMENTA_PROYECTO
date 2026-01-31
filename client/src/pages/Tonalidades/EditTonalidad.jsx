import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { updateTonalidad } from "@/services/tonalidad.services";
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

const EditTonalidad = ({ modalTitle, onClose, isOpen, initialData, onTonalidadEdit }) => {
    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            nombre: initialData?.nombre || '',
            codigo_hex: initialData?.codigo_hex || '#000000'
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                nombre: initialData.nombre,
                codigo_hex: initialData.codigo_hex
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (data) => {
        try {
            const updatedTonalidad = {
                nombre: data.nombre.trim(),
                codigo_hex: data.codigo_hex
            };
            const result = await updateTonalidad(initialData.id_tonalidad, updatedTonalidad);
            if (result && result.code === 1) {
                if (onTonalidadEdit) onTonalidadEdit({ ...updatedTonalidad, id_tonalidad: initialData.id_tonalidad });
                toast.success("Tonalidad actualizada");
                onClose();
            } else {
                toast.error("Error actualizando tonalidad");
            }
        } catch (error) {
            toast.error("Error al actualizar la tonalidad");
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
                                            placeholder="Nombre de Tonalidad"
                                            isRequired
                                            errorMessage={errors.nombre?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name="codigo_hex"
                                    control={control}
                                    rules={{ required: "El color es requerido" }}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="color"
                                            label="Color"
                                            variant="flat"
                                            labelPlacement="outside"
                                            className="h-12"
                                            classNames={{
                                                input: "h-10 w-full p-1 cursor-pointer bg-transparent",
                                                inputWrapper: "h-12 p-0 overflow-hidden"
                                            }}
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

EditTonalidad.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    initialData: PropTypes.object,
    onTonalidadEdit: PropTypes.func
};

export default EditTonalidad;

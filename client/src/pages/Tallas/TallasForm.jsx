import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { createTalla } from "@/services/talla.services";
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

export const TallasForm = ({ modalTitle, onClose, isVisible, onAddTalla }) => {
    const [isOpen, setIsOpen] = useState(isVisible);

    useEffect(() => {
        setIsOpen(isVisible);
    }, [isVisible]);

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { nombre: '', orden: 0 }
    });

    const handleCloseModal = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    const onSubmit = async data => {
        try {
            const newTalla = {
                nombre: data.nombre.trim(),
                orden: Number(data.orden) || 0
            };

            const result = await createTalla(newTalla);
            if (result && result.code === 1) {
                const tallaCreated = result.data;
                if (onAddTalla) onAddTalla(tallaCreated);
                toast.success("Talla creada correctamente");
                handleCloseModal();
            } else {
                toast.error("Error creando talla");
            }
        } catch (error) {
            toast.error("Error al realizar la gestión de la talla");
            console.error(error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCloseModal}
            size="md"
            backdrop="blur"
            classNames={{
                backdrop: "bg-slate-900/40 backdrop-blur-md z-[10005]",
                wrapper: "z-[10006] overflow-hidden",
                base: "z-[10007] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden",
                header: "border-b border-slate-100 dark:border-zinc-800 py-3 px-6 bg-white dark:bg-zinc-900",
                body: "py-6 px-6",
                footer: "border-t border-slate-100 dark:border-zinc-800 py-3 px-6 bg-slate-50/50 dark:bg-zinc-900/50 backdrop-blur-sm"
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
                                            variant="faded"
                                            labelPlacement="outside"
                                            placeholder="Ej: M, L, XL, 40, 42..."
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
                                            label="Orden (opcional)"
                                            variant="faded"
                                            labelPlacement="outside"
                                            placeholder="Para ordenar en listas (0, 1, 2...)"
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
    );
};

TallasForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired,
    onAddTalla: PropTypes.func,
};

export default TallasForm;

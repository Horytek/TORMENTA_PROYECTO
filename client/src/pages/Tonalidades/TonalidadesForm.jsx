import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { createTonalidad } from "@/services/tonalidad.services";
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from "@heroui/react";

export const TonalidadesForm = ({ modalTitle, onClose, isVisible, onAddTonalidad }) => {
    const [isOpen, setIsOpen] = useState(isVisible);

    useEffect(() => {
        setIsOpen(isVisible);
    }, [isVisible]);

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { nombre: '', codigo_hex: '#000000' }
    });

    const handleCloseModal = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    const onSubmit = async data => {
        try {
            const newTonalidad = {
                nombre: data.nombre.trim(),
                codigo_hex: data.codigo_hex
            };

            const result = await createTonalidad(newTonalidad);
            if (result && result.code === 1) {
                // Assuming result.data contains the created object including ID
                const tonalidadCreated = result.data;
                if (onAddTonalidad) onAddTonalidad(tonalidadCreated);
                toast.success("Tonalidad creada correctamente");
                handleCloseModal();
            } else {
                toast.error("Error creando tonalidad");
            }
        } catch (error) {
            toast.error("Error al realizar la gestión de la tonalidad");
            console.error(error);
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
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Color *</label>
                                                <div className="flex items-center gap-3 p-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-100 dark:bg-zinc-900/50">
                                                    <input
                                                        type="color"
                                                        {...field}
                                                        className="h-10 w-10 p-0 border-none rounded-full cursor-pointer bg-transparent"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold uppercase">{field.value}</span>
                                                        <span className="text-xs text-slate-400">Selecciona el color de la tonalidad</span>
                                                    </div>
                                                </div>
                                            </div>
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

TonalidadesForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired,
    onAddTonalidad: PropTypes.func,
};

export default TonalidadesForm;

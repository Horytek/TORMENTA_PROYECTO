import React, { useState } from "react";
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from "@heroui/react";
import { useAddModulo } from "../data/addModulo";
import { toast } from "react-hot-toast";

export default function AddModuloModal({ open, onClose, onModuloCreated, refetch }) {
    const [moduloNombre, setModuloNombre] = useState("");
    const [moduloRuta, setModuloRuta] = useState("");
    const { addModulo, isLoading } = useAddModulo();

    const handleSave = async (closeModal) => {
        if (!moduloNombre.trim() || !moduloRuta.trim()) {
            toast.error("Todos los campos son obligatorios");
            return;
        }

        const response = await addModulo({ nombre: moduloNombre, ruta: moduloRuta });
        if (response.success) {
            toast.success(response.message);
            onModuloCreated?.(response.data);
            refetch?.();

            // Clear the form fields
            setModuloNombre("");
            setModuloRuta("");

            // Close the modal using the function provided by NextUI
            closeModal();
        } else {
            toast.error(response.error || "Error al crear el módulo");
        }
    };

    // This function will clear the form when the modal is manually closed
    const clearForm = () => {
        setModuloNombre("");
        setModuloRuta("");
    };

    return (
        <>
            <Modal
                backdrop="opaque"
                isOpen={open}
                onOpenChange={(value) => {
                    if (!value) {
                        clearForm();
                        onClose();
                    }
                }}
            >
                <ModalContent>
                    {(closeModal) => (
                        <>
                            <ModalHeader>Agregar nuevo modulo</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-gray-600">
                                    Ingrese los datos del módulo.
                                </p>
                                <div className="mt-4 flex flex-col gap-3">
                                    <Input
                                        label="Nombre del módulo"
                                        value={moduloNombre}
                                        onChange={(e) => setModuloNombre(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Ruta del módulo"
                                        value={moduloRuta}
                                        onChange={(e) => setModuloRuta(e.target.value)}
                                        required
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button onPress={() => {
                                    clearForm();
                                    closeModal();
                                }}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={() => handleSave(closeModal)}
                                    isLoading={isLoading}
                                >
                                    {isLoading ? "Guardando..." : "Guardar"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

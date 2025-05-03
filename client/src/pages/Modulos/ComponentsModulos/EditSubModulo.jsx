import React, { useState, useEffect } from "react";
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from "@heroui/react";
import { useUpdateSubModulo } from "../data/updSubModulo";
import { toast, Toaster } from "react-hot-toast";

export default function EditSubModuloModal({ open, onClose, onSubModuloUpdated, refetch, submodulo }) {
    const [submoduloNombre, setSubmoduloNombre] = useState("");
    const [submoduloRuta, setSubmoduloRuta] = useState("");
    const { updateSubModulo, loading } = useUpdateSubModulo();

    useEffect(() => {
        if (submodulo && open) {
            setSubmoduloNombre(submodulo.nombre_sub || "");
            setSubmoduloRuta(submodulo.ruta_submodulo || "");
        }
    }, [submodulo, open]);

    const handleSave = async () => {
        try {
            if (!submoduloNombre.trim() || !submoduloRuta.trim()) {
                toast.error("Todos los campos son requeridos");
                return;
            }

            const submoduleData = {
                nombre_sub: submoduloNombre,
                ruta: submoduloRuta,
            };

            const response = await updateSubModulo(submodulo.id_submodulo, submoduleData);
            
            toast.success("Submódulo actualizado exitosamente");
            onSubModuloUpdated?.(response.data);
            refetch?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al actualizar el submódulo");
        }
    };

    const handleClose = () => {
        setSubmoduloNombre("");
        setSubmoduloRuta("");
        onClose();
    };

    return (
        <>
            <Toaster />
            <Modal
                backdrop="opaque"
                isOpen={open}
                onOpenChange={(value) => {
                    if (!value) handleClose();
                }}
            >
                <ModalContent>
                    {(closeModal) => (
                        <>
                            <ModalHeader>Editar submódulo</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-gray-600">
                                    Edite los datos del submódulo.
                                </p>
                                <div className="mt-4 flex flex-col gap-3">
                                    <Input
                                        label="Nombre del submódulo"
                                        value={submoduloNombre}
                                        onChange={(e) => setSubmoduloNombre(e.target.value)}
                                        required
                                        style={{
                                            border: "none",
                                            boxShadow: "none",
                                            outline: "none",
                                        }}
                                    />
                                    <Input
                                        label="Ruta del submódulo"
                                        value={submoduloRuta}
                                        onChange={(e) => setSubmoduloRuta(e.target.value)}
                                        required
                                        style={{
                                            border: "none",
                                            boxShadow: "none",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button onPress={closeModal}>Cancelar</Button>
                                <Button
                                    color="primary"
                                    onPress={handleSave}
                                    isLoading={loading}
                                >
                                    {loading ? "Guardando..." : "Actualizar"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
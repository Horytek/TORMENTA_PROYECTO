import React, { useState, useEffect } from "react";
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from "@nextui-org/react";
import { useUpdateModulo } from "../data/updModulo";
import { toast, Toaster } from "react-hot-toast";

export default function EditModuloModal({ open, onClose, onModuloUpdated, refetch, modulo }) {
    const [moduloNombre, setModuloNombre] = useState("");
    const [moduloRuta, setModuloRuta] = useState("");
    const { updateModulo, loading } = useUpdateModulo();

    useEffect(() => {
        if (modulo && open) {
            setModuloNombre(modulo.nombre_modulo || "");
            setModuloRuta(modulo.ruta || "");
        }
    }, [modulo, open]);

    const handleSave = async () => {
        try {
            if (!moduloNombre.trim() || !moduloRuta.trim()) {
                toast.error("Todos los campos son requeridos");
                return;
            }

            const moduleData = {
                nombre_modulo: moduloNombre,
                ruta: moduloRuta,
            };

            const response = await updateModulo(modulo.id_modulo, moduleData);
            
            toast.success("Módulo actualizado exitosamente");
            onModuloUpdated?.(response.data);
            refetch?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al actualizar el módulo");
        }
    };

    const handleClose = () => {
        setModuloNombre("");
        setModuloRuta("");
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
                            <ModalHeader>Editar módulo</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-gray-600">
                                    Edite los datos del módulo.
                                </p>
                                <div className="mt-4 flex flex-col gap-3">
                                    <Input
                                        label="Nombre del módulo"
                                        value={moduloNombre}
                                        onChange={(e) => setModuloNombre(e.target.value)}
                                        required
                                        style={{
                                            border: "none",
                                            boxShadow: "none",
                                            outline: "none",
                                        }}
                                    />
                                    <Input
                                        label="Ruta del módulo"
                                        value={moduloRuta}
                                        onChange={(e) => setModuloRuta(e.target.value)}
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
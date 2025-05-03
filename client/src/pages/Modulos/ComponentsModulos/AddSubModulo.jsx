import React, { useState } from "react";
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from "@heroui";
import { addSubmodulo as useAddSubmodulo } from "../data/addSubModulo"; // Rename the import
import { toast, Toaster } from "react-hot-toast";

export default function AddSubModuloModal({ open, onClose, onSubmoduloCreated, refetch, moduleId, moduleName }) {
    const [nombreSub, setNombreSub] = useState("");
    const [rutaSub, setRutaSub] = useState("");
    
    // Properly use the hook
    const { addSubmodulo, isLoading } = useAddSubmodulo();

    const handleSave = async () => {
        try {
            const response = await addSubmodulo({ 
                id_modulo: moduleId,
                nombre_sub: nombreSub, 
                ruta: rutaSub 
            });
            
            if (response.success) {
                toast.success(response.message);
                onSubmoduloCreated?.(response.data);
                refetch?.(); 
                onClose();
            } else {
                toast.error(response.error);
            }
        } catch (error) {
            toast.error("Error al guardar el submódulo");
        }
    };

    const handleClose = () => {
        setNombreSub("");
        setRutaSub("");
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
                            <ModalHeader>Agregar nuevo submódulo</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-gray-600">
                                    Ingrese los datos del submódulo para <strong>{moduleName}</strong>.
                                </p>
                                <div className="mt-4 flex flex-col gap-3">
                                    <Input
                                        label="Nombre del submódulo"
                                        value={nombreSub}
                                        onChange={(e) => setNombreSub(e.target.value)}
                                        required
                                        style={{ border: "none", boxShadow: "none", outline: "none" }}
                                    />
                                    <Input
                                        label="Ruta del submódulo"
                                        value={rutaSub}
                                        onChange={(e) => setRutaSub(e.target.value)}
                                        required
                                        style={{ border: "none", boxShadow: "none", outline: "none" }}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button onPress={closeModal}>Cancelar</Button>
                                <Button
                                    color="primary"
                                    onPress={handleSave}
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

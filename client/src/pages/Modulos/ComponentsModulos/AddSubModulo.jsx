import React, { useState } from "react";
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Autocomplete,
    AutocompleteItem
} from "@heroui/react";
import { addSubmodulo as useAddSubmodulo } from "../data/addSubModulo";
import { toast } from "react-hot-toast";
import { AVAILABLE_ROUTES } from "@/utils/componentRegistry";

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
                            <p className="text-sm text-gray-600 mb-2">
                                Ingrese los datos del submódulo para <strong>{moduleName}</strong>.
                            </p>
                            <div className="flex flex-col gap-4">
                                <Input
                                    label="Nombre del submódulo"
                                    value={nombreSub}
                                    onChange={(e) => setNombreSub(e.target.value)}
                                    required
                                    variant="bordered"
                                />
                                <Autocomplete
                                    label="Ruta del submódulo"
                                    placeholder="Seleccione o escriba una ruta"
                                    defaultItems={AVAILABLE_ROUTES.map(r => ({ value: r, label: r }))}
                                    onInputChange={(value) => setRutaSub(value)}
                                    onSelectionChange={(key) => setRutaSub(key)}
                                    inputValue={rutaSub}
                                    variant="bordered"
                                    allowsCustomValue
                                >
                                    {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
                                </Autocomplete>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button onPress={closeModal} variant="light">Cancelar</Button>
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
    );
}

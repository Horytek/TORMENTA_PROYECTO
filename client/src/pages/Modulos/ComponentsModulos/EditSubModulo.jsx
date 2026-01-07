import React, { useState, useEffect } from "react";
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
import { useUpdateSubModulo } from "../data/updSubModulo";
import { toast } from "react-hot-toast";
import { AVAILABLE_ROUTES } from "@/utils/componentRegistry";

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
                            <p className="text-sm text-gray-600 mb-2">
                                Edite los datos del submódulo.
                            </p>
                            <div className="flex flex-col gap-4">
                                <Input
                                    label="Nombre del submódulo"
                                    value={submoduloNombre}
                                    onChange={(e) => setSubmoduloNombre(e.target.value)}
                                    required
                                    variant="bordered"
                                />
                                <Autocomplete
                                    label="Ruta del submódulo"
                                    placeholder="Seleccione o escriba una ruta"
                                    defaultItems={AVAILABLE_ROUTES.map(r => ({ value: r, label: r }))}
                                    onInputChange={(value) => setSubmoduloRuta(value)}
                                    onSelectionChange={(key) => setSubmoduloRuta(key)}
                                    inputValue={submoduloRuta}
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
                                isLoading={loading}
                            >
                                {loading ? "Guardando..." : "Actualizar"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

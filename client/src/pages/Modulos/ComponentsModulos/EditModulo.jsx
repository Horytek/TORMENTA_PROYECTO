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
import { useUpdateModulo } from "../data/updModulo";
import { toast } from "react-hot-toast";
import { AVAILABLE_ROUTES } from "@/utils/componentRegistry";

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
                            <p className="text-sm text-gray-600 mb-2">
                                Edite los datos del módulo.
                            </p>
                            <div className="flex flex-col gap-4">
                                <Input
                                    label="Nombre del módulo"
                                    value={moduloNombre}
                                    onChange={(e) => setModuloNombre(e.target.value)}
                                    required
                                    variant="bordered"
                                />
                                <Autocomplete
                                    label="Ruta del módulo"
                                    placeholder="Seleccione o escriba una ruta"
                                    defaultItems={AVAILABLE_ROUTES.map(r => ({ value: r, label: r }))}
                                    onInputChange={(value) => setModuloRuta(value)}
                                    onSelectionChange={(key) => setModuloRuta(key)}
                                    inputValue={moduloRuta}
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

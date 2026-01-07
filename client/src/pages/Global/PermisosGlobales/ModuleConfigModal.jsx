import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Checkbox,
    CheckboxGroup,
    Chip,
    Spinner
} from "@heroui/react";
import { updateModuleConfig } from "@/services/actionCatalog.services";
import { toast } from "react-hot-toast";

export const ModuleConfigModal = ({
    isOpen,
    onClose,
    moduleData,
    type, // 'modulo' or 'submodulo'
    allActions, // [{ key, label, isDynamic, ... }]
    currentAllowed, // Keys allowed by default/legacy logic
    onSuccess
}) => {
    // Determine initial selected keys
    const [selectedActions, setSelectedActions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && moduleData) {
            // active_actions comes from DB as JSON. If null/undefined, it means ALL enabled by default (or backward compat)
            // But user wants to CONFIGURE.
            // Logic: 
            // If moduleData.active_actions is set, use it.
            // If not set (legacy), maybe default to standard actions + ALL dynamics? 
            // Or better: Default to ALL available actions to be safe, then let them uncheck.

            let initialKeys = [];
            if (moduleData.active_actions) {
                try {
                    // Check if string (JSON) or already object
                    const parsed = typeof moduleData.active_actions === 'string'
                        ? JSON.parse(moduleData.active_actions)
                        : moduleData.active_actions;

                    if (Array.isArray(parsed)) {
                        initialKeys = parsed;
                    }
                } catch (e) {
                    console.error("Error parsing active_actions", e);
                }
            } else {
                // If not configured, use the passed 'currentAllowed' keys which reflect the current legacy/hardcoded view.
                // This ensures the modal opens with checkboxes matching the visible UI.
                initialKeys = currentAllowed || allActions.map(a => a.key);
            }
            setSelectedActions(initialKeys);
        }
    }, [isOpen, moduleData, allActions]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateModuleConfig(type, moduleData.id, { active_actions: selectedActions });
            toast.success("Configuración de acciones actualizada");
            if (onSuccess) onSuccess(); // Trigger reload
            onClose();
        } catch (error) {
            toast.error("Error al guardar configuración");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur">
            <ModalContent>
                <ModalHeader>
                    Configurar Acciones para {type === 'modulo' ? 'Módulo' : 'Submódulo'}: {moduleData?.nombre || moduleData?.nombre_sub}
                </ModalHeader>
                <ModalBody>
                    <p className="text-sm text-slate-500 mb-4">
                        Selecciona qué acciones estarán disponibles para este {type}. Desmarca las que no apliquen.
                    </p>

                    <CheckboxGroup
                        label="Acciones Disponibles"
                        value={selectedActions}
                        onValueChange={setSelectedActions}
                        orientation="horizontal"
                        classNames={{
                            wrapper: "gap-4 grid grid-cols-2"
                        }}
                    >
                        {allActions.map((action) => (
                            <Checkbox
                                key={action.key}
                                value={action.key}
                                color={action.isDynamic ? "success" : "primary"}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{action.label}</span>
                                    {action.isDynamic && <Chip size="sm" variant="flat" color="success">Dinámica</Chip>}
                                    {!action.isDynamic && <Chip size="sm" variant="dot" color="default">Standard</Chip>}
                                </div>
                            </Checkbox>
                        ))}
                    </CheckboxGroup>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancelar
                    </Button>
                    <Button color="primary" onPress={handleSave} isLoading={loading}>
                        Guardar Cambios
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

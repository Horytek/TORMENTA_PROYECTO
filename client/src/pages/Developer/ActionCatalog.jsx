import React, { useEffect, useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Input,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Textarea
} from "@heroui/react";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { getActions, createAction, updateAction, deleteAction } from "@/services/actionCatalog.services";
import { toast, Toaster } from "react-hot-toast";

const ActionCatalog = () => {
    const [actions, setActions] = useState([]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [editingAction, setEditingAction] = useState(null);
    const [formData, setFormData] = useState({ action_key: "", name: "", description: "" });

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        try {
            const data = await getActions();
            setActions(data);
        } catch (error) {
            toast.error("Error al cargar acciones");
        }
    };

    const handleOpen = (action = null) => {
        if (action) {
            setEditingAction(action);
            setFormData({ action_key: action.action_key, name: action.name, description: action.description || "" });
        } else {
            setEditingAction(null);
            setFormData({ action_key: "", name: "", description: "" });
        }
        onOpen();
    };

    const handleSubmit = async () => {
        try {
            if (editingAction) {
                await updateAction(editingAction.id_action, formData);
                toast.success("Acción actualizada");
            } else {
                await createAction(formData);
                toast.success("Acción creada");
            }
            fetchActions();
            onOpenChange(false);
        } catch (error) {
            toast.error("Error al guardar acción");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("¿Estás seguro de eliminar esta acción?")) {
            try {
                await deleteAction(id);
                toast.success("Acción eliminada");
                fetchActions();
            } catch (error) {
                toast.error("Error al eliminar acción");
            }
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in text-gray-800 dark:text-gray-200">
            <Toaster position="top-right" />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        Catálogo de Acciones
                    </h1>
                    <p className="text-slate-500 text-sm">Define las acciones globales disponibles para los permisos.</p>
                </div>
                <Button
                    onPress={() => handleOpen()}
                    color="primary"
                    endContent={<FaPlus />}
                    className="shadow-lg shadow-blue-500/20"
                >
                    Nueva Acción
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <Table
                    aria-label="Catálogo de Acciones"
                    removeWrapper
                >
                    <TableHeader>
                        <TableColumn>CLAVE</TableColumn>
                        <TableColumn>NOMBRE</TableColumn>
                        <TableColumn>DESCRIPCIÓN</TableColumn>
                        <TableColumn align="center">ESTADO</TableColumn>
                        <TableColumn align="center">ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody items={actions} emptyContent="No hay acciones definidas">
                        {(item) => (
                            <TableRow key={item.id_action} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-slate-100 dark:border-zinc-800 last:border-0">
                                <TableCell>
                                    <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                                        {item.action_key}
                                    </code>
                                </TableCell>
                                <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                                    {item.name}
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm max-w-xs truncate">
                                    {item.description}
                                </TableCell>
                                <TableCell>
                                    <Chip size="sm" color={item.is_active ? "success" : "default"} variant="flat">
                                        {item.is_active ? "Activo" : "Inactivo"}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-center gap-2">
                                        <Button isIconOnly size="sm" variant="light" onPress={() => handleOpen(item)} className="text-blue-500">
                                            <FaEdit />
                                        </Button>
                                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(item.id_action)} className="text-red-500">
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {editingAction ? "Editar Acción" : "Nueva Acción Global"}
                            </ModalHeader>
                            <ModalBody>
                                <Input
                                    autoFocus
                                    label="Clave (Key)"
                                    placeholder="ej: exportar_excel"
                                    variant="bordered"
                                    value={formData.action_key}
                                    onValueChange={(val) => setFormData({ ...formData, action_key: val })}
                                    isDisabled={!!editingAction}
                                    description="Identificador único para usar en código."
                                />
                                <Input
                                    label="Nombre Visible"
                                    placeholder="ej: Exportar Excel"
                                    variant="bordered"
                                    value={formData.name}
                                    onValueChange={(val) => setFormData({ ...formData, name: val })}
                                />
                                <Textarea
                                    label="Descripción"
                                    placeholder="Descripción corta..."
                                    variant="bordered"
                                    value={formData.description}
                                    onValueChange={(val) => setFormData({ ...formData, description: val })}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="flat" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button color="primary" onPress={handleSubmit}>
                                    Guardar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

export default ActionCatalog;

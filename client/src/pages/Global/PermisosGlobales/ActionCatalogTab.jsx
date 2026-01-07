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
    Textarea,
    Card,
    CardBody
} from "@heroui/react";
import { FaPlus, FaTrash, FaEdit, FaCube, FaLock } from "react-icons/fa";
import { getActions, createAction, updateAction, deleteAction } from "@/services/actionCatalog.services";
import { toast } from "react-hot-toast";

const STANDARD_ACTIONS = [
    { id_action: 'std_1', action_key: 'ver', name: 'Ver', description: 'Permite visualizar el módulo o submódulo.', is_active: true, is_standard: true },
    { id_action: 'std_2', action_key: 'crear', name: 'Agregar', description: 'Permite crear nuevos registros.', is_active: true, is_standard: true },
    { id_action: 'std_3', action_key: 'editar', name: 'Editar', description: 'Permite modificar registros existentes.', is_active: true, is_standard: true },
    { id_action: 'std_4', action_key: 'eliminar', name: 'Eliminar', description: 'Permite eliminar registros (soft delete).', is_active: true, is_standard: true },
    { id_action: 'std_5', action_key: 'desactivar', name: 'Desactivar', description: 'Específico para anular/desactivar registros (ej: Clientes).', is_active: true, is_standard: true },
    { id_action: 'std_6', action_key: 'generar', name: 'Generar', description: 'Acción especial para generación de documentos o procesos.', is_active: true, is_standard: true },
];

const ActionCatalogTab = () => {
    const [actions, setActions] = useState([]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [editingAction, setEditingAction] = useState(null);
    const [formData, setFormData] = useState({ action_key: "", name: "", description: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const dynamicData = await getActions();
            // Merge standard and dynamic
            setActions([...STANDARD_ACTIONS, ...dynamicData]);
        } catch (error) {
            toast.error("Error al cargar acciones");
            // Still show standard actions on error
            setActions(STANDARD_ACTIONS);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (action = null) => {
        if (action) {
            if (action.is_standard) return; // Guard clause
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
        <div className="space-y-6 animate-fade-in p-2">

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FaCube className="text-blue-500" />
                        Opciones de Interacción
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Define qué pueden hacer los usuarios en cada módulo. Las acciones estándar son fijas, pero puedes añadir nuevas.
                    </p>
                </div>
                <Button
                    onPress={() => handleOpen()}
                    color="primary"
                    endContent={<FaPlus />}
                    className="shadow-lg shadow-blue-500/20 font-medium"
                >
                    Nueva Opción Global
                </Button>
            </div>

            <Card className="shadow-none border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden">
                <CardBody className="p-0">
                    <Table
                        aria-label="Catálogo de Acciones"
                        removeWrapper
                        classNames={{
                            header: "bg-slate-50 dark:bg-zinc-800",
                            th: "bg-transparent text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider",
                            td: "py-4 border-b border-slate-50 dark:border-zinc-800"
                        }}
                    >
                        <TableHeader>
                            <TableColumn>OPCIÓN / CLAVE</TableColumn>
                            <TableColumn>DESCRIPCIÓN</TableColumn>
                            <TableColumn align="center">TIPO</TableColumn>
                            <TableColumn align="center">ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody items={actions} emptyContent="Cargando acciones...">
                            {(item) => (
                                <TableRow key={item.id_action} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-base">{item.name}</span>
                                            <code className="text-xs text-slate-400 mt-1 bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded w-fit">
                                                {item.action_key}
                                            </code>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
                                        {item.description}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-center">
                                            {item.is_standard ? (
                                                <Chip size="sm" variant="flat" color="primary" startContent={<FaLock size={10} />}>Estándar</Chip>
                                            ) : (
                                                <Chip size="sm" variant="flat" color="success">Dinámica</Chip>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-2">
                                            {!item.is_standard && (
                                                <>
                                                    <Button isIconOnly size="sm" variant="light" onPress={() => handleOpen(item)} className="text-blue-500">
                                                        <FaEdit />
                                                    </Button>
                                                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(item.id_action)} className="text-red-500">
                                                        <FaTrash />
                                                    </Button>
                                                </>
                                            )}
                                            {item.is_standard && (
                                                <span className="text-xs text-slate-400 italic">Sistema</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {editingAction ? "Editar Opción" : "Nueva Opción Global"}
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
                                    description="Identificador único interno. No usar espacios."
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
                                    placeholder="¿Qué permite hacer esta opción?"
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

export default ActionCatalogTab;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Tooltip,
    Button,
    Chip
} from "@heroui/react";
import { FaEdit, FaTrash, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { MdOutlineAddCircleOutline } from "react-icons/md";
import { toast, Toaster } from "react-hot-toast";
import AddSubModuloModal from "./AddSubModulo"
import EditModuloModal from "./EditModulo";
import EditSubModuloModal from "./EditSubModulo";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import useDeleteModulo from "../data/dltModulo";
import useDeleteSubModulo from "../data/dltSubModulo";

const TablaModulos = ({
    modulos,
    submodulos,
    loading,
    error,
    searchTerm,
    getSubmodulosByModuloId,
    refreshModulos
}) => {

    const [openEditModal, setOpenEditModal] = useState(false);
    const [openAddSubModal, setOpenAddSubModal] = useState(false);
    const [selectedModulo, setSelectedModulo] = useState(null);
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [targetModulo, setTargetModulo] = useState(null);
    const { deleteModulo, deleteloading } = useDeleteModulo();
    const { deleteSubModulo, deleteloading: deleteSubModuloLoading } = useDeleteSubModulo();
    const [openConfirmSubModal, setOpenConfirmSubModal] = useState(false);
    const [targetSubModulo, setTargetSubModulo] = useState(null);
    const [expandedModulos, setExpandedModulos] = useState({});
    const [openEditSubModal, setOpenEditSubModal] = useState(false);
    const [selectedSubModulo, setSelectedSubModulo] = useState(null);

    // Initialize expanded state
    useEffect(() => {
        if (!loading && !error && modulos.length > 0) {
            const initialExpanded = {};
            modulos.forEach(m => {
                // Auto-expand if search term is active
                if (searchTerm) {
                    initialExpanded[m.id_modulo] = true;
                }
            });
            if (searchTerm) setExpandedModulos(initialExpanded);
        }
    }, [modulos, searchTerm, loading, error]);

    const toggleExpand = (moduloId) => {
        setExpandedModulos(prev => ({
            ...prev,
            [moduloId]: !prev[moduloId]
        }));
    };

    const filteredModulos = useMemo(() => {
        if (!searchTerm) return modulos;
        return modulos.filter(m =>
            m.nombre_modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.ruta.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [modulos, searchTerm]);

    // Flatten data for table
    const tableItems = useMemo(() => {
        const items = [];
        filteredModulos.forEach(modulo => {
            items.push({ type: 'module', ...modulo, key: `mod-${modulo.id_modulo}` });

            if (expandedModulos[modulo.id_modulo] || searchTerm) {
                const subs = getSubmodulosByModuloId(modulo.id_modulo) || [];
                if (subs.length > 0) {
                    subs.forEach(sub => {
                        items.push({ type: 'submodule', ...sub, parentId: modulo.id_modulo, key: `sub-${sub.id_submodulo}` });
                    });
                } else {
                    items.push({ type: 'empty', parentId: modulo.id_modulo, key: `empty-${modulo.id_modulo}` });
                }
            }
        });
        return items;
    }, [filteredModulos, expandedModulos, searchTerm, getSubmodulosByModuloId]);

    const handleConfirmAction = async () => {
        if (!targetModulo) return;
        try {
            await deleteModulo(targetModulo.id_modulo);
            toast.success("Módulo eliminado exitosamente");
            refreshModulos();
        } catch (err) {
            toast.error("Error al eliminar: " + err.message);
        }
        setOpenConfirmModal(false);
        setTargetModulo(null);
    };

    const handleConfirmSubModuleDeletion = async () => {
        if (!targetSubModulo) return;
        try {
            await deleteSubModulo(targetSubModulo.id_submodulo);
            toast.success("Submódulo eliminado exitosamente");
            refreshModulos();
        } catch (err) {
            toast.error("Error al eliminar submódulo: " + err.message);
        }
        setOpenConfirmSubModal(false);
        setTargetSubModulo(null);
    };

    const columns = [
        { name: "NOMBRE", uid: "nombre" },
        { name: "RUTA / URL", uid: "ruta" },
        { name: "ACCIONES", uid: "acciones" },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case "nombre":
                if (item.type === 'module') {
                    return (
                        <div className="flex items-center gap-2">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onClick={() => toggleExpand(item.id_modulo)}
                                className="text-gray-500 min-w-unit-6 w-unit-6 h-unit-6"
                            >
                                {expandedModulos[item.id_modulo] || searchTerm ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                            </Button>
                            <span className="font-bold text-blue-900">{item.nombre_modulo}</span>
                            <Chip size="sm" variant="flat" color="primary" className="ml-2 h-5 text-[10px]">MÓDULO</Chip>
                        </div>
                    );
                } else if (item.type === 'submodule') {
                    return (
                        <div className="pl-10 flex items-center gap-2 relative">
                            <div className="absolute left-4 top-1/2 w-4 h-[1px] bg-gray-300"></div>
                            <div className="absolute left-4 top-[-50%] bottom-1/2 w-[1px] bg-gray-300"></div>
                            <span className="text-gray-700">{item.nombre_sub}</span>
                        </div>
                    );
                } else {
                    return <div className="pl-10 text-gray-400 italic text-sm">Sin submódulos</div>;
                }
            case "ruta":
                if (item.type === 'empty') return null;
                return (
                    <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {item.type === 'module' ? item.ruta : item.ruta_submodulo}
                    </code>
                );
            case "acciones":
                if (item.type === 'empty') return null;

                if (item.type === 'module') {
                    return (
                        <div className="flex items-center justify-center gap-2">
                            <Tooltip content="Agregar Submódulo">
                                <Button isIconOnly size="sm" variant="flat" color="success" radius="full" onClick={() => { setSelectedModulo(item); setOpenAddSubModal(true); }}>
                                    <MdOutlineAddCircleOutline size={18} />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Editar Módulo">
                                <Button isIconOnly size="sm" variant="flat" color="warning" radius="full" onClick={() => { setSelectedModulo(item); setOpenEditModal(true); }}>
                                    <FaEdit size={16} />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Eliminar Módulo" color="danger">
                                <Button isIconOnly size="sm" variant="flat" color="danger" radius="full" onClick={() => { setTargetModulo(item); setOpenConfirmModal(true); }}>
                                    <FaTrash size={14} />
                                </Button>
                            </Tooltip>
                        </div>
                    );
                } else {
                    return (
                        <div className="flex items-center justify-center gap-2">
                            <Tooltip content="Editar Submódulo">
                                <Button isIconOnly size="sm" variant="flat" color="warning" radius="full" onClick={() => { setSelectedSubModulo(item); setOpenEditSubModal(true); }}>
                                    <FaEdit size={16} />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Eliminar Submódulo" color="danger">
                                <Button isIconOnly size="sm" variant="flat" color="danger" radius="full" onClick={() => { setTargetSubModulo(item); setOpenConfirmSubModal(true); }}>
                                    <FaTrash size={14} />
                                </Button>
                            </Tooltip>
                        </div>
                    );
                }
            default:
                return null;
        }
    }, [expandedModulos, searchTerm]);

    if (loading) return <div className="p-4 text-center">Cargando módulos...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-4">
            <Table
                aria-label="Tabla de Módulos"
                removeWrapper
                classNames={{
                    th: "bg-blue-50/50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 font-bold text-xs uppercase",
                    td: "py-2 border-b border-slate-100 dark:border-zinc-800/50",
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "acciones" ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={tableItems} emptyContent="No se encontraron módulos">
                    {(item) => (
                        <TableRow key={item.key} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Modals */}
            {openConfirmModal && targetModulo && (
                <ConfirmationModal
                    message={`¿Estás seguro de eliminar el módulo "${targetModulo.nombre_modulo}"?`}
                    onClose={() => { setOpenConfirmModal(false); setTargetModulo(null); }}
                    onConfirm={handleConfirmAction}
                    loading={deleteloading}
                />
            )}

            {openConfirmSubModal && targetSubModulo && (
                <ConfirmationModal
                    message={`¿Estás seguro de eliminar el submódulo "${targetSubModulo.nombre_sub}"?`}
                    onClose={() => { setOpenConfirmSubModal(false); setTargetSubModulo(null); }}
                    onConfirm={handleConfirmSubModuleDeletion}
                    loading={deleteSubModuloLoading}
                />
            )}

            <AddSubModuloModal
                open={openAddSubModal}
                onClose={() => setOpenAddSubModal(false)}
                onSubmoduloCreated={refreshModulos}
                refetch={refreshModulos}
                moduleId={selectedModulo?.id_modulo}
                moduleName={selectedModulo?.nombre_modulo}
            />

            <EditModuloModal
                open={openEditModal}
                onClose={() => setOpenEditModal(false)}
                onModuloUpdated={refreshModulos}
                refetch={refreshModulos}
                modulo={selectedModulo}
            />

            <EditSubModuloModal
                open={openEditSubModal}
                onClose={() => setOpenEditSubModal(false)}
                onSubModuloUpdated={refreshModulos}
                refetch={refreshModulos}
                submodulo={selectedSubModulo}
            />
        </div>
    );
};

export default TablaModulos;

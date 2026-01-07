// (Whole File Replacement/Major Refactor to include Auto-Routing Dropdown)
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
    Chip,
    User,
} from "@heroui/react";
import { FaEdit, FaTrash, FaChevronDown, FaChevronRight, FaLink } from "react-icons/fa";
import { MdOutlineAddCircleOutline, MdOutlineSubdirectoryArrowRight } from "react-icons/md";
import { toast } from "react-hot-toast";
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
        { name: "ESTRUCTURA", uid: "nombre" },
        { name: "RUTA / COMPONENTE", uid: "ruta" },
        { name: "GESTIÓN", uid: "acciones" },
    ];

    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case "nombre":
                if (item.type === 'module') {
                    return (
                        <div className="flex items-center gap-3 py-1">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onClick={() => toggleExpand(item.id_modulo)}
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                                {expandedModulos[item.id_modulo] || searchTerm ? <FaChevronDown /> : <FaChevronRight />}
                            </Button>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
                                    {item.nombre_modulo}
                                    <Chip size="sm" variant="dot" color="primary" className="border-none">Principal</Chip>
                                </span>
                            </div>
                        </div>
                    );
                } else if (item.type === 'submodule') {
                    return (
                        <div className="pl-12 flex items-center gap-2 relative h-8">
                            <MdOutlineSubdirectoryArrowRight className="text-gray-300 text-lg" />
                            <span className="text-gray-600 dark:text-gray-300 text-sm font-medium hover:text-blue-500 transition-colors cursor-pointer">
                                {item.nombre_sub}
                            </span>
                        </div>
                    );
                } else {
                    return (
                        <div className="pl-12 opacity-50 flex items-center gap-2 text-xs italic text-gray-400">
                            No tiene submódulos asignados
                        </div>
                    );
                }
            case "ruta":
                if (item.type === 'empty') return null;
                const ruta = item.type === 'module' ? item.ruta : item.ruta_submodulo;
                return (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <FaLink className="text-[10px] opacity-50" />
                        <code className="text-xs font-mono bg-gray-50 dark:bg-zinc-800 px-2 py-1 rounded border border-gray-100 dark:border-zinc-700 select-all">
                            {ruta}
                        </code>
                    </div>
                );
            case "acciones":
                if (item.type === 'empty') return null;

                if (item.type === 'module') {
                    return (
                        <div className="flex items-center justify-end gap-2 pr-4">
                            <Tooltip content="Agregar Submódulo" delay={500}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    className="bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                    radius="full"
                                    onClick={() => { setSelectedModulo(item); setOpenAddSubModal(true); }}
                                >
                                    <MdOutlineAddCircleOutline size={18} />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Editar Módulo" delay={500}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    className="bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                                    radius="full"
                                    onClick={() => { setSelectedModulo(item); setOpenEditModal(true); }}
                                >
                                    <FaEdit size={15} />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Eliminar" color="danger" delay={500}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    radius="full"
                                    className="dark:bg-red-900/20"
                                    onClick={() => { setTargetModulo(item); setOpenConfirmModal(true); }}
                                >
                                    <FaTrash size={14} />
                                </Button>
                            </Tooltip>
                        </div>
                    );
                } else {
                    return (
                        <div className="flex items-center justify-end gap-2 pr-4">
                            <Tooltip content="Editar Submódulo" delay={500}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    className="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                    radius="full"
                                    onClick={() => { setSelectedSubModulo(item); setOpenEditSubModal(true); }}
                                >
                                    <FaEdit size={15} />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Eliminar" color="danger" delay={500}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    radius="full"
                                    onClick={() => { setTargetSubModulo(item); setOpenConfirmSubModal(true); }}
                                >
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-10 gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm">Cargando estructura de módulos...</p>
        </div>
    );

    if (error) return (
        <div className="p-6 bg-red-50 text-red-600 rounded-lg text-center border border-red-100">
            Error: {error}
        </div>
    );

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-zinc-800 p-0 overflow-hidden">
            <Table
                aria-label="Tabla de Módulos"
                removeWrapper
                classNames={{
                    base: "min-h-[400px]",
                    th: "bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 font-medium text-xs tracking-wider border-b border-gray-100 dark:border-zinc-800 h-10",
                    td: "py-3 border-b border-gray-50 dark:border-zinc-800/50 group-hover:bg-gray-50/50 dark:group-hover:bg-zinc-800/30 transition-colors",
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "acciones" ? "end" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={tableItems} emptyContent="No se encontraron módulos">
                    {(item) => (
                        <TableRow key={item.key}>
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

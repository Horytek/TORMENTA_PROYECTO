import React, { useState, useEffect } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@heroui/react";
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import { MdOutlineAddCircleOutline } from "react-icons/md";
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

    useEffect(() => {
        if (!loading && !error) {
            const updatedExpandedState = { ...expandedModulos };
            let changed = false;
            
            Object.keys(updatedExpandedState).forEach(moduloId => {
                if (updatedExpandedState[moduloId]) {
                    const moduleSubmodulos = getSubmodulosByModuloId(Number(moduloId)) || [];
                    if (moduleSubmodulos.length === 0) {
                        updatedExpandedState[moduloId] = false;
                        changed = true;
                    }
                }
            });
            
            if (changed) {
                setExpandedModulos(updatedExpandedState);
            }
        }
    }, [modulos, submodulos, loading]);

    if (loading) return <p>Cargando datos...</p>;
    if (error) return <p>Error al cargar los datos: {error}</p>;

    const toggleExpand = (moduloId) => {
        setExpandedModulos(prev => ({
            ...prev,
            [moduloId]: !prev[moduloId]
        }));
    };

    const renderCell = (modulo, columnKey) => {
        switch (columnKey) {
            case "nombre":
                return modulo.nombre_modulo;
            case "ruta":
                return modulo.ruta;
            case "acciones":
                return (
                    <div className="flex gap-1">
                        <span
                            onClick={() => toggleExpand(modulo.id_modulo)}
                            className="px-1 py-0.5 text-xl text-blue-700 cursor-pointer hover:text-blue-500"
                            title={expandedModulos[modulo.id_modulo] ? "Ocultar submódulos" : "Ver submódulos"}
                        >
                            {expandedModulos[modulo.id_modulo] ?
                                <FaEyeSlash className="h-6 w-4" /> :
                                <FaEye className="h-6 w-4" />
                            }
                        </span>

                        <span
                            onClick={() => {
                                setSelectedModulo(modulo);
                                setOpenEditModal(true);
                            }}
                            className="px-1 py-0.5 text-xl text-yellow-400 cursor-pointer hover:text-yellow-500"
                            title="Editar módulo"
                        >
                            <FaEdit className="h-6 w-4" />
                        </span>
                        <span
                            onClick={() => {
                                setTargetModulo(modulo);
                                setOpenConfirmModal(true);
                            }}
                            className="px-1 py-0.5 text-xl text-red-500 cursor-pointer hover:text-red-600"
                            title="Eliminar módulo"
                        >
                            <FaTrash className="h-6 w-4" />
                        </span>
                        <span
                            onClick={() => {
                                setSelectedModulo(modulo);
                                setOpenAddSubModal(true);
                            }}
                            className="px-1 py-0.5 text-xl text-green-500 cursor-pointer hover:text-green-600"
                            title="Agregar submódulo"
                        >
                            <MdOutlineAddCircleOutline className="h-6 w-5" />
                        </span>
                    </div>
                );
            default:
                return null;
        }
    };

    const rows = [];
    try {
        modulos.forEach(modulo => {
            if (!modulo || typeof modulo !== 'object' || !modulo.id_modulo) return;
            
            rows.push({
                id: `module-${modulo.id_modulo}`,
                type: 'module',
                data: modulo
            });

            if (expandedModulos[modulo.id_modulo]) {
                try {
                    const moduleSubmodulos = Array.isArray(getSubmodulosByModuloId(modulo.id_modulo)) 
                        ? getSubmodulosByModuloId(modulo.id_modulo) 
                        : [];
                    
                    if (moduleSubmodulos.length === 0) {
                        rows.push({
                            id: `empty-${modulo.id_modulo}`,
                            type: 'empty-submodule',
                            parentId: modulo.id_modulo
                        });
                    } else {
                        moduleSubmodulos.forEach(submodulo => {
                            if (!submodulo || !submodulo.id_submodulo) return;
                            
                            rows.push({
                                id: `submodule-${submodulo.id_submodulo}`,
                                type: 'submodule',
                                data: submodulo,
                                parentId: modulo.id_modulo
                            });
                        });
                    }
                } catch (err) {
                    console.error("Error processing submodulos:", err);
                    rows.push({
                        id: `error-${modulo.id_modulo}`,
                        type: 'empty-submodule',
                        parentId: modulo.id_modulo
                    });
                }
            }
        });
    } catch (err) {
        console.error("Error generating rows:", err);
    }

    const columns = [
        { name: "NOMBRE", uid: "nombre" },
        { name: "RUTA / URL", uid: "ruta" },
        { name: "ACCIONES", uid: "acciones" },
    ];
    const centeredColumns = ["acciones"];

    const handleConfirmAction = async () => {
        if (!targetModulo) return;

        try {
            const result = await deleteModulo(targetModulo.id_modulo);
            toast.success("Módulo eliminado exitosamente");
            refreshModulos();
        } catch (err) {
            toast.error("Error al eliminar: " + err.message);
            console.error("Error al eliminar:", err);
        }
        setOpenConfirmModal(false);
        setTargetModulo(null);
    };

    const handleConfirmSubModuleDeletion = async () => {
        if (!targetSubModulo) return;
        
        try {
            // Store the parent module ID before any operations
            const parentModuleId = targetSubModulo.id_modulo;
            
            // Close modal and reset state BEFORE any operations
            setOpenConfirmSubModal(false);
            setTargetSubModulo(null);
            
            // First close the expanded view
            setExpandedModulos(prev => ({
                ...prev,
                [parentModuleId]: false
            }));
            
            // Small delay to ensure UI updates before deletion
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Then delete and refresh
            await deleteSubModulo(targetSubModulo.id_submodulo);
            toast.success("Submódulo eliminado exitosamente");
            await refreshModulos();
        } catch (err) {
            toast.error("Error al eliminar submódulo: " + (err.message || "Error desconocido"));
            console.error("Error al eliminar submódulo:", err);
        }
    };

    return (
        <div className="space-y-4">
            <Toaster />
            <Table aria-label="Tabla de Módulos" isStriped>
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={centeredColumns.includes(column.uid) ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody>
                    {rows.map(row => {
                        if (row.type === 'module') {
                            return (
                                <TableRow key={row.id}>
                                    <TableCell>{row.data.nombre_modulo}</TableCell>
                                    <TableCell>{row.data.ruta}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <span
                                                onClick={() => toggleExpand(row.data.id_modulo)}
                                                className="px-1 py-0.5 text-xl text-blue-700 cursor-pointer hover:text-blue-500"
                                                title={expandedModulos[row.data.id_modulo] ? "Ocultar submódulos" : "Ver submódulos"}
                                            >
                                                {expandedModulos[row.data.id_modulo] ?
                                                    <FaEyeSlash className="h-6 w-4" /> :
                                                    <FaEye className="h-6 w-4" />
                                                }
                                            </span>

                                            <span
                                                onClick={() => {
                                                    setSelectedModulo(row.data);
                                                    setOpenAddSubModal(true);
                                                }}
                                                className="px-1 py-0.5 text-xl text-green-400 cursor-pointer hover:text-green-500"
                                                title="Agregar submódulo"
                                            >
                                                <MdOutlineAddCircleOutline className="h-6 w-4" />
                                            </span>

                                            <span
                                                onClick={() => {
                                                    setSelectedModulo(row.data);
                                                    setOpenEditModal(true);
                                                }}
                                                className="px-1 py-0.5 text-xl text-yellow-400 cursor-pointer hover:text-yellow-500"
                                                title="Editar módulo"
                                            >
                                                <FaEdit className="h-6 w-4" />
                                            </span>
                                            <span
                                                onClick={() => {
                                                    setTargetModulo(row.data);
                                                    setOpenConfirmModal(true);
                                                }}
                                                className="px-1 py-0.5 text-xl text-red-500 cursor-pointer hover:text-red-600"
                                                title="Eliminar módulo"
                                            >
                                                <FaTrash className="h-6 w-4" />
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        } else if (row.type === 'submodule') {
                            return (
                                <TableRow key={row.id} className="bg-gray-50">
                                    <TableCell className="pl-8">➤ {row.data.nombre_sub}</TableCell>
                                    <TableCell>{row.data.ruta_submodulo}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex gap-1 justify-center">
                                            <span
                                                onClick={() => {
                                                    setSelectedSubModulo(row.data);
                                                    setOpenEditSubModal(true);
                                                }}
                                                className="px-1 py-0.5 text-xl text-yellow-400 cursor-pointer hover:text-yellow-500"
                                                title="Editar submódulo"
                                            >
                                                <FaEdit className="h-6 w-4" />
                                            </span>
                                            <span
                                                onClick={() => {
                                                    setTargetSubModulo(row.data);
                                                    setOpenConfirmSubModal(true);
                                                }}
                                                className="px-1 py-0.5 text-xl text-red-500 cursor-pointer hover:text-red-600"
                                                title="Eliminar submódulo"
                                            >
                                                <FaTrash className="h-6 w-4" />
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        } else if (row.type === 'empty-submodule') {
                            return (
                                <TableRow key={row.id} className="bg-gray-50">
                                    <TableCell className="text-center text-gray-500 italic">
                                        No hay submódulos para este módulo
                                    </TableCell>
                                    <TableCell className="text-center text-gray-500 italic">
                                        
                                    </TableCell>
                                    <TableCell className="text-center text-gray-500 italic">
                                        
                                    </TableCell>
                                </TableRow>
                            );
                        } else {
                            return null;
                        }
                    })}
                </TableBody>
            </Table>

            {openConfirmModal && targetModulo && (
                <ConfirmationModal
                    message="¿Estás seguro de eliminar este módulo?"
                    onClose={() => {
                        setOpenConfirmModal(false);
                        setTargetModulo(null);
                    }}
                    onConfirm={handleConfirmAction}
                    loading={deleteloading}
                />
            )}

            {openConfirmSubModal && targetSubModulo && (
                <ConfirmationModal
                    message="¿Estás seguro de eliminar este submódulo?"
                    onClose={() => {
                        setOpenConfirmSubModal(false);
                        setTargetSubModulo(null);
                    }}
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

            {/* Add the EditModuloModal here */}
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

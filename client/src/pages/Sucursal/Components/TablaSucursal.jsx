import React, { useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Tooltip,
    Chip
} from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { usePermisos } from '@/routes';

const TablaSucursal = ({
    sucursales,
    updateSucursalLocal,
    removeSucursal,
    onEdit,

    page = 1,
    limit = 10
}) => {

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    const { hasDeletePermission, hasEditPermission } = usePermisos();

    const pages = Math.ceil(sucursales.length / limit);
    const items = React.useMemo(() => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return sucursales.slice(start, end);
    }, [page, limit, sucursales]);

    const columns = [
        { name: "VENDEDOR", uid: "vendedor" },
        { name: "NOMBRE", uid: "nombre" },
        { name: "DIRECCIÓN", uid: "direccion" },
        { name: "ESTADO", uid: "estado", align: "center" },
        { name: "ACCIONES", uid: "acciones", align: "center" },
    ];

    const handleOpenConfirmationModal = (row, id) => {
        setSelectedRow(row);
        setSelectedId(id);
        setOpenConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedId) return;
        await removeSucursal(selectedId);
        setOpenConfirmModal(false);
        setSelectedId(null);
        setSelectedRow(null);
    };

    const renderCell = (sucursal, columnKey) => {
        switch (columnKey) {
            case "vendedor":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-slate-600 dark:text-slate-300">{sucursal.nombre_vendedor || "-"}</p>
                    </div>
                );
            case "nombre":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-slate-900 dark:text-slate-100 font-semibold">{sucursal.nombre_sucursal}</p>
                    </div>
                );
            case "direccion":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-slate-600 dark:text-slate-300">{sucursal.ubicacion || "-"}</p>
                    </div>
                );
            case "estado":
                const isActive = sucursal.estado_sucursal !== 0 && sucursal.estado_sucursal !== 'Inactivo';
                return (
                    <Chip
                        className="gap-1 border-none capitalize"
                        color={isActive ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                        startContent={
                            <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-success-600' : 'bg-danger-600'} ml-1`}></span>
                        }
                    >
                        {isActive ? 'Activo' : 'Inactivo'}
                    </Chip>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content={hasEditPermission ? "Editar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => hasEditPermission && onEdit(sucursal)}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors cursor-pointer ${hasEditPermission
                                    ? "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                                    : "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                                    }`}
                            >
                                <MdEdit className="w-4 h-4" />
                            </span>
                        </Tooltip>
                        <Tooltip content={hasDeletePermission ? "Eliminar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => hasDeletePermission && handleOpenConfirmationModal(sucursal.nombre_sucursal, sucursal.id)}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors cursor-pointer ${hasDeletePermission
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/30"
                                    : "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                                    }`}
                            >
                                <FaTrash className="w-3.5 h-3.5" />
                            </span>
                        </Tooltip>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="hidden md:block overflow-x-auto w-full">
            <Table
                aria-label="Tabla de sucursales"
                className="min-w-[800px]"

                removeWrapper
                classNames={{
                    base: "",
                    table: "min-w-full",
                    th: "bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider h-11 first:rounded-l-lg last:rounded-r-lg shadow-none border-b border-slate-200 dark:border-zinc-800",
                    td: "py-3 border-b border-slate-100 dark:border-zinc-800 group-data-[first=true]:first:before:rounded-none group-data-[first=true]:last:before:rounded-none",
                    tr: "hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors shadow-none",
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "acciones" || column.uid === "estado" ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={(items || []).filter(i => i && i.id)} emptyContent={"No se encontraron sucursales"}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10 rounded-xl overflow-hidden mt-2">
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {(items || []).filter(i => i && i.id).map((item) => {
                        const isActive = item.estado_sucursal !== 0 && item.estado_sucursal !== 'Inactivo';
                        return (
                            <div key={item.id} className="p-4 flex flex-col gap-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                            {item.nombre_sucursal}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                                            Vendedor: {item.nombre_vendedor || "-"}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0">
                                        <Chip
                                            className="gap-1 border-none capitalize"
                                            color={isActive ? "success" : "danger"}
                                            size="sm"
                                            variant="flat"
                                            startContent={<span className={`w-1 h-1 rounded-full ${isActive ? 'bg-success-600' : 'bg-danger-600'} ml-1`}></span>}
                                        >
                                            {isActive ? 'Activo' : 'Inactivo'}
                                        </Chip>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 text-xs">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500 shrink-0">Dirección:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right line-clamp-2">{item.ubicacion || "-"}</span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-3 flex justify-end items-center border-t border-slate-100 dark:border-zinc-800/50 gap-2">
                                    <Tooltip content={hasEditPermission ? "Editar" : "Sin permisos"}>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => hasEditPermission && onEdit(item)}
                                            className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors cursor-pointer ${
                                                hasEditPermission
                                                    ? "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                                                    : "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                                            }`}
                                        >
                                            <MdEdit className="w-4 h-4" />
                                        </span>
                                    </Tooltip>
                                    <Tooltip content={hasDeletePermission ? "Eliminar" : "Sin permisos"}>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => hasDeletePermission && handleOpenConfirmationModal(item.nombre_sucursal, item.id)}
                                            className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors cursor-pointer ${
                                                hasDeletePermission
                                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/30"
                                                    : "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                                            }`}
                                        >
                                            <FaTrash className="w-3.5 h-3.5" />
                                        </span>
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                    {(items || []).filter(i => i && i.id).length === 0 && (
                        <div className="py-10 text-center text-slate-400">
                            <p className="text-sm font-medium">No se encontraron sucursales registradas.</p>
                        </div>
                    )}
                </div>
            </div>

            {openConfirmModal && (
                <ConfirmationModal
                    message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                    onClose={() => setOpenConfirmModal(false)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </>
    );
};

export default TablaSucursal;

import React from "react";
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
import { deleteAlmacen } from '@/services/almacen.services';
import { usePermisos } from '@/routes';

const TablaAlmacen = ({
    almacenes,
    updateAlmacenLocal,
    removeAlmacen,
    onEdit,

    page,
    limit,
    setPage,
    setLimit
}) => {
    const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState(null);
    const [selectedRow, setSelectedRow] = React.useState(null);

    const { hasDeletePermission, hasEditPermission } = usePermisos();

    const pages = Math.ceil(almacenes.length / limit);
    const items = React.useMemo(() => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return almacenes.slice(start, end);
    }, [page, limit, almacenes]);

    const columns = [
        { name: "ID", uid: "id" },
        { name: "ALMACÉN", uid: "almacen" },
        { name: "SUCURSAL", uid: "sucursal" },
        { name: "UBICACIÓN", uid: "ubicacion" },
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
        const result = await deleteAlmacen(selectedId);
        if (result === 1) {
            removeAlmacen(selectedId);
        } else if (result === 2) {
            updateAlmacenLocal(selectedId, { estado_almacen: "Inactivo" });
        }
        setOpenConfirmModal(false);
        setSelectedId(null);
        setSelectedRow(null);
    };

    const renderCell = (almacen, columnKey) => {
        switch (columnKey) {
            case "id":
                return <span className="text-slate-500 dark:text-slate-400">#{almacen.id_almacen}</span>;
            case "almacen":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-slate-900 dark:text-slate-100 font-semibold">{almacen.nom_almacen}</p>
                    </div>
                );
            case "sucursal":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-slate-600 dark:text-slate-300">{almacen.nombre_sucursal || "-"}</p>
                    </div>
                );
            case "ubicacion":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-slate-600 dark:text-slate-300">{almacen.ubicacion || "-"}</p>
                    </div>
                );
            case "estado":
                const isActive = almacen.estado_almacen === 'Activo';
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
                        {almacen.estado_almacen}
                    </Chip>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content={hasEditPermission ? "Editar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => hasEditPermission && onEdit(almacen)}
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
                                onClick={() => hasDeletePermission && handleOpenConfirmationModal(almacen.nom_almacen, almacen.id_almacen)}
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
                aria-label="Tabla de almacenes"
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
                <TableBody items={items} emptyContent={"No se encontraron almacenes"}>
                    {(item) => (
                        <TableRow key={item.id_almacen}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10 rounded-xl overflow-hidden mt-2">
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {items.map((item) => {
                        const isActive = item.estado_almacen === 'Activo';
                        return (
                            <div key={item.id_almacen} className="p-4 flex flex-col gap-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col min-w-0 pr-2">
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                            {item.nom_almacen}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                                            #{item.id_almacen}
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
                                            {item.estado_almacen}
                                        </Chip>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 text-xs">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500 shrink-0">Sucursal:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right truncate">{item.nombre_sucursal || "-"}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500 shrink-0">Ubicación:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-right truncate">{item.ubicacion || "-"}</span>
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
                                            onClick={() => hasDeletePermission && handleOpenConfirmationModal(item.nom_almacen, item.id_almacen)}
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
                    {items.length === 0 && (
                        <div className="py-10 text-center text-slate-400">
                            <p className="text-sm font-medium">No se encontraron almacenes registrados.</p>
                        </div>
                    )}
                </div>
            </div>

            {openConfirmModal && (
                <ConfirmationModal
                    isOpen={openConfirmModal}
                    message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                    onClose={() => setOpenConfirmModal(false)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </>
    );
};

export default TablaAlmacen;

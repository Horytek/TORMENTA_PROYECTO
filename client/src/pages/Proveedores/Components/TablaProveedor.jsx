import React, { useState, useMemo } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Tooltip,
    User,
    Chip
} from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { deleteDestinatario } from '@/services/destinatario.services';
import { usePermisos } from '@/routes';
import EmptyState from "@/components/Shared/EmptyState";

const TablaProveedor = ({
    destinatarios,
    updateDestinatarioLocal,
    removeDestinatario,
    onEdit,

    page = 1,
    limit = 10
}) => {

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    const { hasDeletePermission, hasEditPermission } = usePermisos();

    // Pagination Logic
    const pages = Math.ceil(destinatarios.length / limit);
    const items = useMemo(() => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return destinatarios.slice(start, end);
    }, [page, limit, destinatarios]);

    const handleOpenConfirmationModal = (row, id) => {
        setSelectedRow(row);
        setSelectedId(id);
        setOpenConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedId) return;
        await deleteDestinatario(selectedId);
        removeDestinatario(selectedId);
        setOpenConfirmModal(false);
        setSelectedId(null);
        setSelectedRow(null);
    };

    const columns = [
        { name: "PROVEEDOR", uid: "datos" },
        { name: "UBICACIÓN", uid: "ubicacion" },
        { name: "CONTACTO", uid: "contacto" },
        { name: "ESTADO", uid: "estado", align: "center" },
        { name: "ACCIONES", uid: "acciones", align: "center" },
    ];

    const renderCell = (destinatario, columnKey) => {
        switch (columnKey) {
            case "datos":
                return (
                    <User
                        avatarProps={{ radius: "lg", src: null, name: (destinatario.destinatario || "?")[0], classNames: { base: "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-slate-200" } }}
                        description={
                            <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                                {destinatario.documento || "Sin documento"}
                            </span>
                        }
                        name={destinatario.destinatario}
                        classNames={{
                            name: "text-slate-900 dark:text-slate-100 font-bold",
                            description: "block"
                        }}
                    >
                        {destinatario.destinatario}
                    </User>
                );
            case "ubicacion":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small capitalize text-slate-700 dark:text-slate-300 font-medium">{destinatario.ubicacion || "Sin ubicación"}</p>
                        <p className="text-tiny text-slate-400 dark:text-slate-500">{destinatario.direccion}</p>
                    </div>
                );
            case "contacto":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-slate-700 dark:text-slate-300">{destinatario.email || "-"}</p>
                        <p className="text-tiny text-slate-400 dark:text-slate-500">{destinatario.telefono || "-"}</p>
                    </div>
                );
            case "estado":
                const estadoRaw = destinatario.estado_destinatario ?? destinatario.estado ?? destinatario.estado_proveedor;

                const isActive = Number(estadoRaw) === 1;

                return (
                    <Chip
                        className="gap-1 border-none capitalize"
                        color={isActive ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                        startContent={
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success-600' : 'bg-danger-600'} ml-1`}
                            ></span>
                        }
                    >
                        {isActive ? "Activo" : "Inactivo"}
                    </Chip>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content={hasEditPermission ? "Editar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); hasEditPermission && onEdit(destinatario); }}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors ${hasEditPermission
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-200"
                                    : "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400"
                                    }`}
                            >
                                <MdEdit className="w-4 h-4" />
                            </span>
                        </Tooltip>
                        <Tooltip content={hasDeletePermission ? "Eliminar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); hasDeletePermission && handleOpenConfirmationModal(destinatario.destinatario, destinatario.id); }}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors ${hasDeletePermission
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-900/20 dark:hover:bg-rose-900/30"
                                    : "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400"
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
            <Table
                aria-label="Tabla de proveedores"

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
                <TableBody items={items} emptyContent={<EmptyState title="No se encontraron proveedores" description="Intenta ajustar tus filtros de búsqueda." />}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {openConfirmModal && (
                <ConfirmationModal
                    isOpen={openConfirmModal}
                    message={`¿Estás seguro que deseas eliminar a "${selectedRow}"?`}
                    onClose={() => setOpenConfirmModal(false)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </>
    );
};

export default TablaProveedor;

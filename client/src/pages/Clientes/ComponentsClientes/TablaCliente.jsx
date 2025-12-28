import React, { useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Select,
    SelectItem,
    Tooltip,
    Chip,
    User,
    Checkbox
} from "@heroui/react";
import { MdEdit, MdVisibility } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import EditClientModal from "./EditClient.jsx";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import useCliente from "@/services/client_data/useCliente";
import deactivateCliente from "@/services/client_data/deactivateCliente";
import useUpdateClient from "@/services/client_data/updateCliente";
import { toast, Toaster } from "react-hot-toast";
import ViewClientModal from "./ShowClient";
import TableSkeleton from "@/components/Skeletons/TableSkeleton";
import EmptyState from "@/components/Shared/EmptyState";
import { usePermisos } from '@/routes';

const TablaCliente = ({
    clientes,
    loading,
    error,
    metadata,
    page,
    limit,
    changePage,
    changeLimit,
    onEdit,
    onDelete,
    setAllClientes,
    selectedKeys,
    onSelectionChange
}) => {
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [targetClient, setTargetClient] = useState(null);

    const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

    const { deleteClient, deleteLoading } = useCliente();
    const deactivateClienteHook = deactivateCliente();
    const { darDeBajaCliente, deleteLoading: deactivateLoading } = deactivateClienteHook;
    const { updateClient, isLoading: updateLoading } = useUpdateClient();

    if (loading) return <TableSkeleton rows={8} />;
    if (error) return <div className="p-8 text-center text-red-500">Error al cargar los datos: {error}</div>;

    const columns = [
        { name: "CLIENTE", uid: "datos" },
        { name: "DIRECCIÓN", uid: "direccion" },
        { name: "ESTADO", uid: "estado", align: "center" },
        { name: "ACCIONES", uid: "acciones", align: "center" },
    ];

    const renderCell = (cliente, columnKey) => {
        switch (columnKey) {
            case "datos":
                return (
                    <User
                        avatarProps={{ radius: "xl", src: null, name: (cliente.nombres || cliente.razon_social || "?")[0] }}
                        description={cliente.dniRuc}
                        name={cliente.razon_social || `${cliente.nombres} ${cliente.apellidos}`}
                        classNames={{
                            name: "text-slate-900 dark:text-slate-100 font-semibold",
                            description: "text-slate-400 dark:text-slate-500"
                        }}
                    >
                        {cliente.dniRuc}
                    </User>
                );
            case "direccion":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small capitalize text-slate-600 dark:text-slate-300">{cliente.direccion || "Sin dirección"}</p>
                    </div>
                );
            case "estado":
                const isActive = cliente.estado === 1 || cliente.estado === "1";
                return (
                    <Chip
                        className="gap-1 border-none capitalize"
                        color={isActive ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                        startContent={
                            <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-success-600' : 'bg-danger-600'} ml-1`}
                            ></span>
                        }
                    >
                        {isActive ? "Activo" : "Inactivo"}
                    </Chip>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <ViewClientModal
                            client={cliente}
                            trigger={
                                <Tooltip content="Ver detalle cliente">
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Ver detalle cliente"
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors shadow-sm cursor-pointer"
                                    >
                                        <MdVisibility className="w-5 h-5" />
                                    </span>
                                </Tooltip>
                            }
                            onEdit={() => hasEditPermission && (setSelectedClient(cliente), setOpenEditModal(true))}
                            onDeactivate={() => {
                                const isInactive = cliente.estado === 0 || cliente.estado === "0";
                                if (hasDeactivatePermission && !isInactive) {
                                    setActionType("deactivate");
                                    setTargetClient(cliente);
                                    setOpenConfirmModal(true);
                                }
                            }}
                            onReactivate={() => {
                                const isInactive = cliente.estado === 0 || cliente.estado === "0";
                                if (hasDeactivatePermission && isInactive) {
                                    setActionType("reactivate");
                                    setTargetClient(cliente);
                                    setOpenConfirmModal(true);
                                }
                            }}
                            onDelete={() => {
                                if (hasDeletePermission) {
                                    setActionType("delete");
                                    setTargetClient(cliente);
                                    setOpenConfirmModal(true);
                                }
                            }}
                            permissions={{
                                hasEditPermission,
                                hasDeletePermission,
                                hasDeactivatePermission
                            }}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const handleConfirmAction = async () => {
        if (!targetClient) return;

        if (actionType === "deactivate") {
            const result = await darDeBajaCliente(targetClient.id);
            if (result.success) {
                toast.success("Cliente dado de baja exitosamente");
                if (setAllClientes) {
                    setAllClientes(prev => prev.map(c => c.id === targetClient.id ? { ...c, estado: 0 } : c));
                }
                if (onDelete) onDelete(targetClient.id);
            } else {
                toast.error("Error al desactivar: " + result.error);
            }
        } else if (actionType === "reactivate") {
            const clientData = {
                id_cliente: targetClient.id,
                dni: targetClient.dni,
                ruc: targetClient.ruc,
                nombres: targetClient.nombres,
                apellidos: targetClient.apellidos,
                razon_social: targetClient.razon_social,
                direccion: targetClient.direccion,
                estado: 1
            };

            const result = await updateClient(clientData);
            if (result.success) {
                toast.success("Cliente reactivado exitosamente");
                if (setAllClientes) {
                    setAllClientes(prev => prev.map(c => c.id === targetClient.id ? { ...c, estado: 1 } : c));
                }
                if (onDelete) onDelete(targetClient.id);
            } else {
                toast.error("Error al reactivar: " + (result.error?.message || result.error || "Error desconocido"));
            }
        } else if (actionType === "delete") {
            const result = await deleteClient(targetClient.id);
            if (result.success) {
                toast.success("Cliente eliminado exitosamente");
                if (setAllClientes) {
                    setAllClientes(prev => prev.filter(c => c.id !== targetClient.id));
                }
                if (onDelete) onDelete(targetClient.id);
            } else {
                toast.error("Error al eliminar: " + result.error);
            }
        }
        setOpenConfirmModal(false);
        setTargetClient(null);
    };

    const loadingConfirm =
        actionType === "delete" ? deleteLoading :
            actionType === "deactivate" ? deactivateLoading :
                actionType === "reactivate" ? updateLoading : false;

    return (
        <>
            <Toaster />

            <Table
                aria-label="Tabla de clientes"
                selectionMode="multiple"
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
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
                <TableBody items={clientes} emptyContent={<EmptyState title="No se encontraron clientes" description="Intenta ajustar tus filtros de búsqueda." />}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {selectedClient && (
                <EditClientModal
                    key={selectedClient.id}
                    open={openEditModal}
                    onClose={() => {
                        setOpenEditModal(false);
                        setSelectedClient(null);
                    }}
                    client={selectedClient}
                    onClientUpdated={(updatedClient) => {
                        if (setAllClientes && updatedClient) {
                            setAllClientes(prev => prev.map(c => c.id === updatedClient.id ? { ...c, ...updatedClient } : c));
                        }
                        if (onEdit) onEdit();
                        setOpenEditModal(false);
                        setSelectedClient(null);
                    }}
                />
            )}

            {openConfirmModal && targetClient && (
                <ConfirmationModal
                    message={
                        actionType === "delete" ? "¿Eliminar cliente?" :
                            actionType === "deactivate" ? "¿Dar de baja?" :
                                "¿Reactivar cliente?"
                    }
                    onClose={() => setOpenConfirmModal(false)}
                    onConfirm={handleConfirmAction}
                    loading={loadingConfirm}
                />
            )}
        </>
    );
};

export default TablaCliente;
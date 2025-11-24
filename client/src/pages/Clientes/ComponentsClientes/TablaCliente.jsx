import React, { useState } from "react";
import {
    Pagination,
    Select,
    SelectItem,
    Tooltip,
    Button,
    Chip,
    User,
    ScrollShadow,
    Checkbox
} from "@heroui/react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { MdEdit, MdDelete, MdRemoveCircleOutline, MdVisibility } from "react-icons/md";
import EditClientModal from "./EditClient.jsx";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import useCliente from "@/services/client_data/useCliente";
import deactivateCliente from "@/services/client_data/deactivateCliente";
import useUpdateClient from "@/services/client_data/updateCliente";
import { toast, Toaster } from "react-hot-toast";
import ViewClientModal from "./ShowClient";
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
    setAllClientes
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

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando datos...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error al cargar los datos: {error}</div>;

    const renderCell = (cliente, columnKey) => {
        switch (columnKey) {
            case "datos":
                return (
                    <User
                        avatarProps={{ radius: "lg", src: null, name: (cliente.nombres || cliente.razon_social || "?")[0] }}
                        description={cliente.dniRuc}
                        name={cliente.razon_social || `${cliente.nombres} ${cliente.apellidos}`}
                        classNames={{
                            name: "text-blue-900 dark:text-blue-100 font-semibold",
                            description: "text-blue-400 dark:text-blue-300"
                        }}
                    >
                        {cliente.dniRuc}
                    </User>
                );
            case "direccion":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small capitalize text-gray-600 dark:text-gray-300">{cliente.direccion || "Sin dirección"}</p>
                    </div>
                );
            case "estado":
                const isActive = cliente.estado === 1 || cliente.estado === "1";
                return (
                    <span className={`
                        inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
                        border
                        ${!isActive
                            ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/60"
                            : "bg-green-100 text-green-700 border-green-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/60"
                        }
                    `}>
                        {!isActive ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {isActive ? "Activo" : "Inactivo"}
                    </span>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center h-full">
                        <Tooltip content="Ver detalle cliente" placement="top">
                            <ViewClientModal
                                client={cliente}
                                trigger={
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Ver detalle cliente"
                                        className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                                    >
                                        <MdVisibility className="w-5 h-5" />
                                    </span>
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
                        </Tooltip>
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
                if (onDelete) onDelete(targetClient.id); // Trigger refresh if needed
            } else {
                toast.error("Error al desactivar: " + result.error);
            }
        } else if (actionType === "reactivate") {
            // Prepare data for update - assuming we need to send at least ID and new status
            // We'll try to send what we have to be safe, but focusing on status
            const clientData = {
                id_cliente: targetClient.id,
                dni: targetClient.dni,
                ruc: targetClient.ruc,
                nombres: targetClient.nombres,
                apellidos: targetClient.apellidos,
                razon_social: targetClient.razon_social,
                direccion: targetClient.direccion,
                estado: 1 // Reactivate
            };

            const result = await updateClient(clientData);
            if (result.success) {
                toast.success("Cliente reactivado exitosamente");
                if (setAllClientes) {
                    setAllClientes(prev => prev.map(c => c.id === targetClient.id ? { ...c, estado: 1 } : c));
                }
                if (onDelete) onDelete(targetClient.id); // Trigger refresh
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
            <div className="bg-white/90 dark:bg-[#18192b] rounded-2xl shadow border border-blue-100 dark:border-zinc-700 p-0">
                <div className="p-4 bg-white dark:bg-[#232339] rounded-2xl">
                    <ScrollShadow hideScrollBar>
                        <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
                            <thead>
                                <tr className="bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 text-[13px] font-bold">
                                    <th className="py-2 px-4 text-left align-middle">Cliente</th>
                                    <th className="py-2 px-4 text-left align-middle">Dirección</th>
                                    <th className="py-2 px-4 text-center align-middle">Estado</th>
                                    <th className="py-2 px-4 text-center align-middle">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron clientes</td>
                                    </tr>
                                ) : (
                                    clientes.map((cliente, idx) => (
                                        <tr
                                            key={cliente.id}
                                            className={`transition-colors duration-150 ${idx % 2 === 0
                                                ? "bg-white dark:bg-[#18192b]"
                                                : "bg-blue-50/40 dark:bg-blue-900/10"
                                                } hover:bg-blue-100/60 dark:hover:bg-blue-900/30`}
                                        >
                                            <td className="py-2 px-4 align-middle">{renderCell(cliente, "datos")}</td>
                                            <td className="py-2 px-4 align-middle">{renderCell(cliente, "direccion")}</td>
                                            <td className="py-2 px-4 text-center align-middle">{renderCell(cliente, "estado")}</td>
                                            <td className="py-2 px-4 text-center align-middle">{renderCell(cliente, "acciones")}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </ScrollShadow>
                </div>
            </div>

            <div className="flex justify-between items-center mt-2 px-4 pb-2">
                {/* Paginación a la izquierda */}
                <Pagination
                    showControls
                    page={page}
                    total={metadata?.pages || metadata?.total_pages || 1}
                    onChange={changePage}
                    color="primary"
                    size="sm"
                />
                {/* Totales + selector a la derecha */}
                <div className="flex gap-3 items-center">
                    <span className="text-[12px] text-default-400">
                        {metadata?.total || metadata?.total_records || 0} clientes
                    </span>
                    <Select
                        size="sm"
                        className="w-24"
                        selectedKeys={[`${limit}`]}
                        onChange={(e) => changeLimit(Number(e.target.value))}
                        aria-label="Filas por página"
                    >
                        <SelectItem key="5">5</SelectItem>
                        <SelectItem key="10">10</SelectItem>
                        <SelectItem key="15">15</SelectItem>
                        <SelectItem key="20">20</SelectItem>
                    </Select>
                </div>
            </div>

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
                        onEdit();
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
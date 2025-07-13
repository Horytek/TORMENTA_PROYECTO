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
} from "@heroui/react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { MdDoNotDisturbAlt } from "react-icons/md";
import FiltroCliente from "./FiltroCliente";
import EditClientModal from "./EditClient.jsx";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import useCliente from "../data/useCliente";
import deactivateCliente from "../data/deactivateCliente.js";
import { toast, Toaster } from "react-hot-toast";
import ViewClientModal from "./ShowClient";
import { usePermisos } from '@/routes';


const TablaCliente = ({
    clientes,
    totales,
    loading,
    error,
    metadata,
    docType,
    page,
    limit,
    changePage,
    changeLimit,
    onFilter,
}) => {
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [targetClient, setTargetClient] = useState(null);

    const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

    const { deleteClient, deleteLoading } = useCliente();
    // Instanciamos el hook para desactivar clientes
    const deactivateClienteHook = deactivateCliente();
    const { darDeBajaCliente, deleteLoading: deactivateLoading } = deactivateClienteHook;

    if (loading) return <p>Cargando datos...</p>;
    if (error) return <p>Error al cargar los datos: {error}</p>;

    const renderCell = (cliente, columnKey) => {
        switch (columnKey) {
            case "dniRuc":
                return cliente.dniRuc;
            case "datos":
                return cliente.razon_social && cliente.razon_social.trim() !== ""
                    ? cliente.razon_social
                    : `${cliente.nombres} ${cliente.apellidos}`;
            case "direccion":
                return cliente.direccion && cliente.direccion.trim() !== ""
                    ? cliente.direccion
                    : <span className="text-gray-500 italic">Sin datos en la dirección</span>;
            case "estado": {
                const estadoTexto =
                    cliente.estado === 1 || cliente.estado === "1"
                        ? "Activo"
                        : "Inactivo";
                return (
                    <span className={
                        estadoTexto === "Activo"
                            ? "inline-flex items-center gap-x-1 py-1 px-2 rounded-full text-sm bg-green-200 text-green-700"
                            : "inline-flex items-center gap-x-1 py-1 px-2 rounded-full text-sm bg-red-100 text-red-600"
                    }>
                        {estadoTexto}
                    </span>
                );
            }
            case "acciones":
                const isInactive = cliente.estado === "0" || cliente.estado === 0;
                return (
                    <div className="flex gap-1">
                        <ViewClientModal
                            client={{
                                type: cliente.tipo_persona === "JURIDICA" ? "business" : "personal",
                                documentType: cliente.tipo_documento?.toLowerCase() || "dni",
                                documentNumber: cliente.dniRuc,
                                name: cliente.razon_social || `${cliente.nombres} ${cliente.apellidos}`,
                                address: cliente.direccion,
                                email: cliente.correo,
                                phone: cliente.telefono,
                                status: cliente.estado === "1" || cliente.estado === 1 ? "active" : "inactive",
                                createdAt: cliente.f_creacion,
                                lastPurchase: cliente.ultima_compra
                            }}
                        />
                        <Tooltip content={hasEditPermission ? "Editar cliente" : "No tiene permisos para editar"}>
                            <span
                                onClick={() => {
                                    if (!hasEditPermission) return;
                                    setSelectedClient(cliente);
                                    setOpenEditModal(true);
                                }}
                                className="px-1 py-0.5 text-xl text-yellow-400 cursor-pointer hover:text-yellow-500"
                            >
                                <FaEdit className={`h-6 w-4 ${!hasEditPermission ? 'opacity-50 cursor-not-allowed' : ''}`} />
                            </span>
                        </Tooltip>
                        <Tooltip content={
                            isInactive 
                            ? "El cliente ya se encuentra dado de baja" 
                            : hasDeactivatePermission 
                                ? "Dar de baja al cliente" 
                                : "No tiene permisos para dar de baja"
                        }>
                            <span
                                onClick={() => {
                                    if (!hasDeactivatePermission) return;
                                    if (isInactive) {
                                        toast.error("El cliente ya se encuentra dado de baja");
                                        return;
                                    }
                                    setActionType("deactivate");
                                    setTargetClient(cliente);
                                    setOpenConfirmModal(true);
                                }}
                                className={`px-1 py-0.5 text-xl ${isInactive
                                    ? "text-gray-400 cursor-not-allowed"
                                    : hasDeactivatePermission
                                        ? "text-red-500 cursor-pointer hover:text-red-600"
                                        : "text-gray-400 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <MdDoNotDisturbAlt className="h-6 w-4" />
                            </span>
                        </Tooltip>
                        <Tooltip content={hasDeletePermission ? "Eliminar cliente" : "No tiene permisos para eliminar"}>
                            <span
                                onClick={() => {
                                    if (!hasDeletePermission) return;
                                    setActionType("delete");
                                    setTargetClient(cliente);
                                    setOpenConfirmModal(true);
                                }}
                                className="px-1 py-0.5 text-xl text-red-500 cursor-pointer hover:text-red-600"
                            >
                                <FaTrash className={`h-6 w-4 ${!hasDeletePermission ? 'opacity-50 cursor-not-allowed' : ''}`} />
                            </span>
                        </Tooltip>
                    </div>
                );
            default:
                return null;
        }
    };

    const columns = [
        { name: "DNI / RUC", uid: "dniRuc" },
        { name: "DATOS CLIENTE", uid: "datos" },
        { name: "DIRECCIÓN", uid: "direccion" },
        { name: "ESTADO", uid: "estado" },
        { name: "ACCIONES", uid: "acciones" },
    ];
    const centeredColumns = ["dniRuc", "estado", "acciones"];

    const handleConfirmAction = async () => {
        if (!targetClient) return;

        if (actionType === "deactivate") {
            if (targetClient.estado === "0" || targetClient.estado === 0) {
                toast.error("El cliente ya se encuentra dado de baja");
                setOpenConfirmModal(false);
                setTargetClient(null);
                return;
            }

            const result = await darDeBajaCliente(targetClient.id);
            if (result.success) {
                toast.success("Cliente dado de baja exitosamente");
                onDelete(targetClient.id);
            } else {
                toast.error("Error al desactivar: " + result.error);
                console.error("Error al desactivar:", result.error);
            }
        } else if (actionType === "delete") {
            const result = await deleteClient(targetClient.id);
            if (result.success) {
                toast.success("Cliente eliminado exitosamente");
                onDelete(targetClient.id);
            } else {
                toast.error("Error al eliminar: " + result.error);
                console.error("Error al eliminar:", result.error);
            }
        }
        setOpenConfirmModal(false);
        setTargetClient(null);
    };

    const loadingConfirm =
        actionType === "delete" ? deleteLoading :
            actionType === "deactivate" ? deactivateLoading : false;

    // Update the filter handler
    const handleFilter = (filterData) => {
        if (onFilter) {
            onFilter(filterData);
        }
    };

    return (
        <div className="space-y-4">
            <Toaster />
            {/* Update the FiltroCliente component usage */}
            <div className="mb-2">
                <FiltroCliente
                    docType={docType}
                    onFilter={handleFilter} />
            </div>
            <Table
                isStriped
                aria-label="Tabla de Clientes"
                bottomContent={
                    <div className="flex w-full justify-between items-center">
                        <Select
                            size="sm"
                            label="Filas por página"
                            selectedKeys={[`${limit}`]}
                            className="w-[150px]"
                            defaultSelectedKeys={["5"]}
                            onChange={(e) => {
                                const newLimit = Number(e.target.value);
                                changeLimit(newLimit);
                            }}
                            isDisabled={!clientes || clientes.length === 0}
                        >
                            <SelectItem key="5" value="5">5</SelectItem>
                            <SelectItem key="10" value="10">10</SelectItem>
                            <SelectItem key="15" value="15">15</SelectItem>
                            <SelectItem key="20" value="20">20</SelectItem>
                            <SelectItem key="100000000" value="100000">Todos</SelectItem>
                        </Select>
                        <Pagination
                            showControls
                            color="primary"
                            page={page}
                            total={metadata.total_pages}
                            onChange={(newPage) => changePage(newPage)}
                            initialPage={1}
                            isDisabled={loading || !clientes || clientes.length === 0 || metadata.total_records === 0}
                        />
                    </div>
                }
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={centeredColumns.includes(column.uid) ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={clientes}
                    loadingContent={<p>Cargando registros...</p>}
                    loadingState={loading ? "loading" : "idle"}
                    emptyContent={
                        <div className="flex justify-center items-center h-24 text-gray-500">
                            No se encontraron registros.
                        </div>
                    }
                >
                    {(cliente) => (
                        <TableRow key={cliente.id}>
                            {(columnKey) => (
                                <TableCell className={centeredColumns.includes(columnKey) ? "text-center" : ""}>
                                    {renderCell(cliente, columnKey)}
                                </TableCell>
                            )}
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
                    onClientUpdated={() => {
                        onEdit(); 
                        setOpenEditModal(false);
                        setSelectedClient(null);
                    }}
                />
            )}
            {openConfirmModal && targetClient && (
                <ConfirmationModal
                    message={
                        actionType === "delete"
                            ? "¿Estás seguro de eliminar este cliente?"
                            : "¿Estás seguro de dar de baja este cliente?"
                    }
                    onClose={() => {
                        setOpenConfirmModal(false);
                        setTargetClient(null);
                    }}
                    onConfirm={handleConfirmAction}
                    loading={loadingConfirm}
                />
            )}
        </div>
    );
};

export default TablaCliente;
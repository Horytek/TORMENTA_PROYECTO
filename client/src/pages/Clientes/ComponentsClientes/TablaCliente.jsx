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
    ScrollShadow,
    Button,
} from "@heroui/react";
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { MdEdit, MdDelete, MdRemoveCircleOutline, MdVisibility } from "react-icons/md";
import FiltroCliente from "./FiltroCliente";
import EditClientModal from "./EditClient.jsx";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import useCliente from "@/services/client_data/useCliente";
import deactivateCliente from "@/services/client_data/deactivateCliente";
import { toast, Toaster } from "react-hot-toast";
import ViewClientModal from "./ShowClient";
import { usePermisos } from '@/routes';
import { Pencil, Trash2, Eye, Ban, CheckCircle, XCircle } from "lucide-react";

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
    onEdit,
    onDelete,
    setAllClientes // <-- asegúrate de recibir este prop del padre
}) => {
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [viewClient, setViewClient] = useState(null); // Añade este estado si no existe


    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [targetClient, setTargetClient] = useState(null);

    const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

    const { deleteClient, deleteLoading } = useCliente();
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
        <span
            className={`
                inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
                ${estadoTexto === "Activo"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-rose-100 text-rose-700 border border-rose-200"}
            `}
        >
            {estadoTexto === "Activo" ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
            )}
            {estadoTexto}
        </span>
    );
}
case "acciones":
    const isInactive = cliente.estado === "0" || cliente.estado === 0;
    return (
        <div className="flex items-center justify-center gap-2">
                <ViewClientModal
                    client={cliente}
                    trigger={
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            className="hover:bg-blue-50 transition"
                        >
                            <MdVisibility className="h-5 w-5" />
                        </Button>
                    }
                />
            <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
                <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color={hasEditPermission ? "warning" : "default"}
                    onClick={() => hasEditPermission ? (setSelectedClient(cliente), setOpenEditModal(true)) : null}
                    className={hasEditPermission ? "hover:bg-yellow-50 cursor-pointer" : "rounded-full opacity-50 cursor-not-allowed"}
                >
                    <MdEdit className="h-5 w-5" />
                </Button>
            </Tooltip>
            <Tooltip content={
                isInactive
                    ? "El cliente ya se encuentra dado de baja"
                    : hasDeactivatePermission
                        ? "Dar de baja al cliente"
                        : "No tiene permisos para dar de baja"
            }>
                <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color={hasDeactivatePermission && !isInactive ? "danger" : "default"}
                    onClick={() => {
                        if (!hasDeactivatePermission || isInactive) return;
                        setActionType("deactivate");
                        setTargetClient(cliente);
                        setOpenConfirmModal(true);
                    }}
                    className={isInactive || !hasDeactivatePermission ? "opacity-50 cursor-not-allowed" : "hover:bg-rose-50 cursor-pointer"}
                >
                    <MdRemoveCircleOutline className="h-5 w-5" />
                </Button>
            </Tooltip>
            <Tooltip content={hasDeletePermission ? "Eliminar" : "No tiene permisos para eliminar"}>
                <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color={hasDeletePermission ? "danger" : "default"}
                    onClick={() => hasDeletePermission ? (setActionType("delete"), setTargetClient(cliente), setOpenConfirmModal(true)) : null}
                    className={hasDeletePermission ? "hover:bg-rose-50 cursor-pointer" : "rounded-full opacity-50 cursor-not-allowed"}
                >
                    <MdDelete className="h-5 w-5" />
                </Button>
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
                // Actualiza el array local en tiempo real
                if (setAllClientes) {
                    setAllClientes(prev =>
                        prev.map(c =>
                            c.id === targetClient.id
                                ? { ...c, estado: 0 }
                                : c
                        )
                    );
                }
                if (onDelete) onDelete(targetClient.id);
            } else {
                toast.error("Error al desactivar: " + result.error);
                console.error("Error al desactivar:", result.error);
            }
        } else if (actionType === "delete") {
            const result = await deleteClient(targetClient.id);
            if (result.success) {
                toast.success("Cliente eliminado exitosamente");
                // Elimina del array local en tiempo real
                if (setAllClientes) {
                    setAllClientes(prev => prev.filter(c => c.id !== targetClient.id));
                }
                if (onDelete) onDelete(targetClient.id);
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

    const handleFilter = (filterData) => {
        if (onFilter) {
            onFilter(filterData);
        }
    };

   return (
   <>
    <Toaster />
    <FiltroCliente
        docType={docType}
        onFilter={handleFilter}
        className="mb-6 px-6 pt-6"
    />
    <ScrollShadow hideScrollBar className="rounded-2xl">
        <Table
            isStriped
            aria-label="Tabla de Clientes"
            className="min-w-full text-[13px]"
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.uid} align={centeredColumns.includes(column.uid) ? "center" : "start"} className="text-blue-900 font-bold bg-blue-50">
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
                {(cliente, idx) => (
                    <TableRow
                        key={cliente.id}
                        className={`transition-colors duration-150 ${
                            idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                        } hover:bg-blue-100/60`}
                    >
                        {(columnKey) => (
                            <TableCell className={centeredColumns.includes(columnKey) ? "text-center" : ""}>
                                {renderCell(cliente, columnKey)}
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </ScrollShadow>
    <div className="flex w-full justify-between items-center px-2 py-2 mt-2">
        <Pagination
            showControls
            color="primary"
            page={page}
            total={metadata.total_pages}
            onChange={(newPage) => changePage(newPage)}
            initialPage={1}
            isDisabled={loading || !clientes || clientes.length === 0 || metadata.total_records === 0}
        />
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
                    setAllClientes(prev =>
                        prev.map(c =>
                            c.id === updatedClient.id
                                ? { ...c, ...updatedClient }
                                : c
                        )
                    );
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
</>
);
};

export default TablaCliente;
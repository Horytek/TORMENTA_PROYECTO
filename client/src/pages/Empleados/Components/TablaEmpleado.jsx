import React, { useState } from "react";
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
import { deactivateVendedor, getVendedor } from '@/services/vendedor.services';
import { usePermisos } from '@/routes';
import VendedoresForm from '../VendedoresForm';

const TablaEmpleado = ({
    vendedores,
    addVendedor,
    updateVendedorLocal,
    removeVendedor,

    page = 1,
    limit = 10
}) => {

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [selectedDni, setSelectedDni] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [initialData, setInitialData] = useState(null);

    const { hasDeletePermission, hasEditPermission } = usePermisos();

    const pages = Math.ceil(vendedores.length / limit);
    const items = React.useMemo(() => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return vendedores.slice(start, end);
    }, [page, limit, vendedores]);

    const columns = [
        { name: "EMPLEADO", uid: "datos" },
        { name: "CONTACTO", uid: "contacto" },
        { name: "ESTADO", uid: "estado", align: "center" },
        { name: "ACCIONES", uid: "acciones", align: "center" },
    ];

    const handleOpenConfirmationModal = (row, dni) => {
        setSelectedRow(row);
        setSelectedDni(dni);
        setOpenConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedDni) return;
        await deactivateVendedor(selectedDni);
        removeVendedor(selectedDni);
        setOpenConfirmModal(false);
        setSelectedDni(null);
        setSelectedRow(null);
    };

    const handleEditModal = async (dni) => {
        try {
            const data = await getVendedor(dni);
            if (!data) return;
            setInitialData(data);
            setIsEditModalOpen(true);
        } catch (error) { }
    };

    const handleSuccess = (dni, updatedData) => {
        if (initialData) {
            updateVendedorLocal(dni, updatedData);
        } else {
            addVendedor(updatedData);
        }
        setIsEditModalOpen(false);
        setInitialData(null);
    };

    const renderCell = (vendedor, columnKey) => {
        switch (columnKey) {
            case "datos":
                return (
                    <User
                        avatarProps={{ radius: "lg", src: null, name: (vendedor.nombre || "?")[0] }}
                        description={vendedor.usua}
                        name={vendedor.nombre}
                        classNames={{
                            name: "text-slate-900 dark:text-slate-100 font-semibold",
                            description: "text-slate-400 dark:text-slate-500"
                        }}
                    >
                        {vendedor.usua}
                    </User>
                );
            case "contacto":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small capitalize text-slate-600 dark:text-slate-300">{vendedor.telefono || "Sin teléfono"}</p>
                        <p className="text-tiny text-slate-400 dark:text-slate-500">{vendedor.dni}</p>
                    </div>
                );
            case "estado":
                const isActive = vendedor.estado_vendedor === "Activo";
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
                        {vendedor.estado_vendedor}
                    </Chip>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content={hasEditPermission ? "Editar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => hasEditPermission && handleEditModal(vendedor.dni)}
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
                                onClick={() => hasDeletePermission && handleOpenConfirmationModal(vendedor.nombre, vendedor.dni)}
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
            <Table
                aria-label="Tabla de empleados"

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
                <TableBody items={items} emptyContent={"No se encontraron empleados"}>
                    {(item) => (
                        <TableRow key={item.dni}>
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

            {isEditModalOpen && (
                <VendedoresForm
                    modalTitle={'Editar Vendedor'}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setInitialData(null);
                    }}
                    initialData={initialData}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    );
};

export default TablaEmpleado;

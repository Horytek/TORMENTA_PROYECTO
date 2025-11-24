import React, { useState } from "react";
import {
    Pagination,
    Select,
    SelectItem,
    Tooltip,
    Button,
    User,
    ScrollShadow
} from "@heroui/react";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { deactivateVendedor, getVendedor } from '@/services/vendedor.services';
import { usePermisos } from '@/routes';
import VendedoresForm from '../VendedoresForm';

const TablaEmpleado = ({
    vendedores,
    addVendedor,
    updateVendedorLocal,
    removeVendedor
}) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [selectedDni, setSelectedDni] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [initialData, setInitialData] = useState(null);

    const { hasDeletePermission, hasEditPermission } = usePermisos();

    // Pagination Logic
    const pages = Math.ceil(vendedores.length / limit);
    const items = React.useMemo(() => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return vendedores.slice(start, end);
    }, [page, limit, vendedores]);

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
            if (!data || data.length === 0) return;
            setInitialData(data[0]);
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
                            name: "text-blue-900 dark:text-blue-100 font-semibold",
                            description: "text-blue-400 dark:text-blue-300"
                        }}
                    >
                        {vendedor.usua}
                    </User>
                );
            case "contacto":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small capitalize text-gray-600 dark:text-gray-300">{vendedor.telefono || "Sin teléfono"}</p>
                        <p className="text-tiny text-gray-400 dark:text-gray-500">{vendedor.dni}</p>
                    </div>
                );
            case "estado":
                const isActive = vendedor.estado_vendedor === "Activo";
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
                        {vendedor.estado_vendedor}
                    </span>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content={hasEditPermission ? "Editar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => hasEditPermission && handleEditModal(vendedor.dni)}
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors ${hasEditPermission
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
                                className={`inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors ${hasDeletePermission
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
            <div className="bg-white/90 dark:bg-[#18192b] rounded-2xl shadow border border-blue-100 dark:border-zinc-700 p-0">
                <div className="p-4 bg-white dark:bg-[#232339] rounded-2xl">
                    <ScrollShadow hideScrollBar>
                        <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
                            <thead>
                                <tr className="bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 text-[13px] font-bold">
                                    <th className="py-2 px-4 text-left align-middle">Empleado</th>
                                    <th className="py-2 px-4 text-left align-middle">Contacto</th>
                                    <th className="py-2 px-4 text-center align-middle">Estado</th>
                                    <th className="py-2 px-4 text-center align-middle">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron empleados</td>
                                    </tr>
                                ) : (
                                    items.map((vendedor, idx) => (
                                        <tr
                                            key={vendedor.dni}
                                            className={`transition-colors duration-150 ${idx % 2 === 0
                                                ? "bg-white dark:bg-[#18192b]"
                                                : "bg-blue-50/40 dark:bg-blue-900/10"
                                                } hover:bg-blue-100/60 dark:hover:bg-blue-900/30`}
                                        >
                                            <td className="py-2 px-4 align-middle">{renderCell(vendedor, "datos")}</td>
                                            <td className="py-2 px-4 align-middle">{renderCell(vendedor, "contacto")}</td>
                                            <td className="py-2 px-4 text-center align-middle">{renderCell(vendedor, "estado")}</td>
                                            <td className="py-2 px-4 text-center align-middle">{renderCell(vendedor, "acciones")}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </ScrollShadow>
                </div>
            </div>

            <div className="flex justify-between items-center mt-2 px-4 pb-2">
                <Pagination
                    showControls
                    page={page}
                    total={pages || 1}
                    onChange={setPage}
                    color="primary"
                    size="sm"
                />
                <div className="flex gap-3 items-center">
                    <span className="text-[12px] text-default-400">
                        {vendedores.length} empleados
                    </span>
                    <Select
                        size="sm"
                        className="w-24"
                        selectedKeys={[`${limit}`]}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        aria-label="Filas por página"
                    >
                        <SelectItem key="5">5</SelectItem>
                        <SelectItem key="10">10</SelectItem>
                        <SelectItem key="15">15</SelectItem>
                        <SelectItem key="20">20</SelectItem>
                    </Select>
                </div>
            </div>

            {openConfirmModal && (
                <ConfirmationModal
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

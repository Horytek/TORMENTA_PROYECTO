import React, { useState } from "react";
import {
    Pagination,
    Select,
    SelectItem,
    Tooltip,
    Button,
    ScrollShadow
} from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { usePermisos } from '@/routes';

const TablaSucursal = ({
    sucursales,
    updateSucursalLocal,
    removeSucursal,
    onEdit
}) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    const { hasDeletePermission, hasEditPermission } = usePermisos();

    // Pagination Logic
    const pages = Math.ceil(sucursales.length / limit);
    const items = React.useMemo(() => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return sucursales.slice(start, end);
    }, [page, limit, sucursales]);

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

    const renderEstado = (estado) => (
        <span className={`
            inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
            ${estado === 0 || estado === 'Inactivo'
                ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"}
        `}>
            {estado === 0 || estado === 'Inactivo' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
            {estado === 0 || estado === 'Inactivo' ? 'Inactivo' : 'Activo'}
        </span>
    );

    const renderCell = (sucursal, columnKey) => {
        switch (columnKey) {
            case "vendedor":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-gray-600 dark:text-gray-300">{sucursal.nombre_vendedor || "-"}</p>
                    </div>
                );
            case "nombre":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-blue-900 dark:text-blue-100 font-semibold">{sucursal.nombre_sucursal}</p>
                    </div>
                );
            case "direccion":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-gray-600 dark:text-gray-300">{sucursal.ubicacion || "-"}</p>
                    </div>
                );
            case "estado":
                return renderEstado(sucursal.estado_sucursal);
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content={hasEditPermission ? "Editar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => hasEditPermission && onEdit(sucursal)}
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
                                onClick={() => hasDeletePermission && handleOpenConfirmationModal(sucursal.nombre_sucursal, sucursal.id)}
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
                                    <th className="py-2 px-4 text-left align-middle">Vendedor</th>
                                    <th className="py-2 px-4 text-left align-middle">Nombre</th>
                                    <th className="py-2 px-4 text-left align-middle">Dirección</th>
                                    <th className="py-2 px-4 text-center align-middle">Estado</th>
                                    <th className="py-2 px-4 text-center align-middle">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron sucursales</td>
                                    </tr>
                                ) : (
                                    items.map((sucursal, idx) => (
                                        <tr
                                            key={sucursal.id}
                                            className={`transition-colors duration-150 ${idx % 2 === 0
                                                ? "bg-white dark:bg-[#18192b]"
                                                : "bg-blue-50/40 dark:bg-blue-900/10"
                                                } hover:bg-blue-100/60 dark:hover:bg-blue-900/30`}
                                        >
                                            <td className="py-2 px-4 align-middle">{renderCell(sucursal, "vendedor")}</td>
                                            <td className="py-2 px-4 align-middle">{renderCell(sucursal, "nombre")}</td>
                                            <td className="py-2 px-4 align-middle">{renderCell(sucursal, "direccion")}</td>
                                            <td className="py-2 px-4 text-center align-middle">{renderCell(sucursal, "estado")}</td>
                                            <td className="py-2 px-4 text-center align-middle">{renderCell(sucursal, "acciones")}</td>
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
                        {sucursales.length} sucursales
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
                    message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                    onClose={() => setOpenConfirmModal(false)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </>
    );
};

export default TablaSucursal;

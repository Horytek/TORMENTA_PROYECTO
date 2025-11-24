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
import { deleteDestinatario } from '@/services/destinatario.services';
import { usePermisos } from '@/routes';
import DestinatariosForm from '../DestinatariosForm';

const TablaProveedor = ({
    destinatarios,
    updateDestinatarioLocal,
    removeDestinatario,
    onEdit
}) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    const { hasDeletePermission, hasEditPermission } = usePermisos();

    // Pagination Logic
    const pages = Math.ceil(destinatarios.length / limit);
    const items = React.useMemo(() => {
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

    const renderCell = (destinatario, columnKey) => {
        switch (columnKey) {
            case "datos":
                return (
                    <User
                        avatarProps={{ radius: "lg", src: null, name: (destinatario.destinatario || "?")[0] }}
                        description={destinatario.documento}
                        name={destinatario.destinatario}
                        classNames={{
                            name: "text-blue-900 dark:text-blue-100 font-semibold",
                            description: "text-blue-400 dark:text-blue-300"
                        }}
                    >
                        {destinatario.destinatario}
                    </User>
                );
            case "ubicacion":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small capitalize text-gray-600 dark:text-gray-300">{destinatario.ubicacion || "Sin ubicación"}</p>
                        <p className="text-tiny text-gray-400 dark:text-gray-500">{destinatario.direccion}</p>
                    </div>
                );
            case "contacto":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small text-gray-600 dark:text-gray-300">{destinatario.email || "-"}</p>
                        <p className="text-tiny text-gray-400 dark:text-gray-500">{destinatario.telefono || "-"}</p>
                    </div>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content={hasEditPermission ? "Editar" : "Sin permisos"}>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={() => hasEditPermission && onEdit(destinatario)}
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
                                onClick={() => hasDeletePermission && handleOpenConfirmationModal(destinatario.destinatario, destinatario.id)}
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
                                    <th className="py-2 px-4 text-left align-middle">Proveedor</th>
                                    <th className="py-2 px-4 text-left align-middle">Ubicación</th>
                                    <th className="py-2 px-4 text-left align-middle">Contacto</th>
                                    <th className="py-2 px-4 text-center align-middle">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 dark:text-gray-500">No se encontraron proveedores</td>
                                    </tr>
                                ) : (
                                    items.map((destinatario, idx) => (
                                        <tr
                                            key={destinatario.id}
                                            className={`transition-colors duration-150 ${idx % 2 === 0
                                                ? "bg-white dark:bg-[#18192b]"
                                                : "bg-blue-50/40 dark:bg-blue-900/10"
                                                } hover:bg-blue-100/60 dark:hover:bg-blue-900/30`}
                                        >
                                            <td className="py-2 px-4 align-middle">{renderCell(destinatario, "datos")}</td>
                                            <td className="py-2 px-4 align-middle">{renderCell(destinatario, "ubicacion")}</td>
                                            <td className="py-2 px-4 align-middle">{renderCell(destinatario, "contacto")}</td>
                                            <td className="py-2 px-4 text-center align-middle">{renderCell(destinatario, "acciones")}</td>
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
                        {destinatarios.length} proveedores
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
        </>
    );
};

export default TablaProveedor;

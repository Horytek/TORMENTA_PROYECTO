import React, { useState, useMemo, useCallback } from "react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { Tooltip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Pagination, Select, SelectItem } from "@heroui/react";
import { usePermisos } from "@/routes";
import { deleteTonalidad } from "@/services/tonalidad.services";
import EditTonalidad from "./EditTonalidad";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

const columns = [
    { name: "NOMBRE", uid: "nombre" },
    { name: "COLOR", uid: "codigo_hex" },
    { name: "ACCIONES", uid: "acciones" },
];

export function ShowTonalidades({ searchTerm, tonalidades, setTonalidades, onUpdate, onDelete }) {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const { hasEditPermission, hasDeletePermission } = usePermisos();

    const filteredItems = useMemo(() => {
        return tonalidades.filter((t) =>
            t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tonalidades, searchTerm]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const handleOpenEditModal = (row) => {
        setSelectedRow(row);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedRow(null);
    };

    const handleDelete = async (id) => {
        try {
            await deleteTonalidad(id);
            setTonalidades((prev) => prev.filter((t) => t.id_tonalidad !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = (updatedTonalidad) => {
        setTonalidades((prev) =>
            prev.map((t) =>
                t.id_tonalidad === updatedTonalidad.id_tonalidad ? { ...t, ...updatedTonalidad } : t
            )
        );
    };

    const handleOpenConfirmationModal = (row) => {
        setSelectedRow(row.nombre);
        setSelectedId(row.id_tonalidad);
        setIsConfirmationModalOpen(true);
    };

    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };

    const handleConfirmDelete = () => {
        handleDelete(selectedId);
        handleCloseConfirmationModal();
    };

    const renderCell = useCallback((item, columnKey) => {
        const cellValue = item[columnKey];

        switch (columnKey) {
            case "nombre":
                return (
                    <p className="text-bold text-sm capitalize text-slate-700 dark:text-slate-200">{cellValue}</p>
                );
            case "codigo_hex":
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: cellValue }} />
                        <span className="text-xs text-slate-500">{cellValue}</span>
                    </div>
                );
            case "acciones":
                return (
                    <div className="flex gap-1 justify-center">
                        <Tooltip content={hasEditPermission ? "Editar" : "Sin permiso"}>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="primary"
                                onPress={() => hasEditPermission && handleOpenEditModal(item)}
                                isDisabled={!hasEditPermission}
                                className="text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                            >
                                <MdEdit size={18} />
                            </Button>
                        </Tooltip>
                        <Tooltip color="danger" content={hasDeletePermission ? "Eliminar" : "Sin permiso"}>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => hasDeletePermission && handleOpenConfirmationModal(item)}
                                isDisabled={!hasDeletePermission}
                                className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                            >
                                <FaTrash size={16} />
                            </Button>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [hasEditPermission, hasDeletePermission]);

    return (
        <>
            <div className="w-full space-y-4">
                <Table
                    aria-label="Tabla de Tonalidades"
                    removeWrapper
                    isHeaderSticky
                    classNames={{
                        base: "max-h-[600px] overflow-scroll",
                        th: "bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 h-10",
                        td: "py-3 border-b border-slate-100 dark:border-zinc-800/50 text-slate-700 dark:text-slate-300",
                        tr: "hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn
                                key={column.uid}
                                align={column.uid === "acciones" ? "center" : "start"}
                            >
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={items} emptyContent={"No hay tonalidades registradas."}>
                        {(item) => (
                            <TableRow key={item.id_tonalidad}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-3 mt-4">
                    <div className="flex items-center gap-3 text-small text-slate-500 dark:text-slate-400 ml-2">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {filteredItems.length} tonalidades
                        </span>
                        <Select
                            size="sm"
                            className="w-20"
                            selectedKeys={[rowsPerPage.toString()]}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                            aria-label="Filas por página"
                            classNames={{
                                trigger: "bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 h-8 min-h-8",
                                value: "text-small font-medium text-slate-600 dark:text-slate-300"
                            }}
                        >
                            <SelectItem key="5" value="5">5</SelectItem>
                            <SelectItem key="10" value="10">10</SelectItem>
                            <SelectItem key="15" value="15">15</SelectItem>
                            <SelectItem key="20" value="20">20</SelectItem>
                        </Select>
                    </div>
                    {pages > 0 && (
                        <Pagination
                            isCompact
                            showControls
                            color="primary"
                            page={page}
                            total={pages}
                            onChange={(page) => setPage(page)}
                            classNames={{ cursor: "bg-blue-600 shadow-md" }}
                        />
                    )}
                </div>
            </div>

            {isConfirmationModalOpen && (
                <ConfirmationModal
                    isOpen={true}
                    message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                    onClose={handleCloseConfirmationModal}
                    onConfirm={handleConfirmDelete}
                />
            )}

            {isEditModalOpen && selectedRow && (
                <EditTonalidad
                    isOpen={isEditModalOpen}
                    modalTitle={"Editar tonalidad"}
                    onClose={handleCloseEditModal}
                    initialData={selectedRow}
                    onTonalidadEdit={handleUpdate}
                />
            )}
        </>
    );
}

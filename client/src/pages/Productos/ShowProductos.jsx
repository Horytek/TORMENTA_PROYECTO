import React, { useState, useMemo, useCallback } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip } from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { deleteProducto } from '@/services/productos.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import Barcode from '../../components/Barcode/Barcode';
import { usePermisos } from '@/routes';

const columns = [
    { name: "DESCRIPCIÓN", uid: "descripcion" },
    { name: "LÍNEA", uid: "nom_marca" },
    { name: "SUB-LÍNEA", uid: "nom_subcat" },
    { name: "UND. MED.", uid: "undm" },
    { name: "PRECIO (S/.)", uid: "precio" },
    { name: "COD. BARRAS", uid: "cod_barras" },
    { name: "ESTADO", uid: "estado_producto" },
    { name: "ACCIONES", uid: "acciones" },
];

export function ShowProductos({ searchTerm, productos, onEdit, onDelete }) {
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Filtrar productos
    const filteredItems = useMemo(() => {
        return productos.filter(producto =>
            (producto.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (producto.cod_barras || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (producto.id_producto !== undefined ? producto.id_producto.toString() : '').includes(searchTerm.toLowerCase())
        );
    }, [productos, searchTerm]);

    // Lógica de paginación
    const pages = Math.ceil(filteredItems.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems]);

    // Estados de modal de eliminación
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const handleOpenConfirmationModal = (row, id_producto) => {
        setSelectedRow(row);
        setSelectedId(id_producto);
        setIsConfirmationModalOpen(true);
    };

    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };

    const handleConfirmDelete = async () => {
        await deleteProducto(selectedId);
        onDelete(selectedId);
        handleCloseConfirmationModal();
    };

    const downloadBarcode = (producto) => {
        const svg = document.querySelector(`#barcode-${producto.id_producto} svg`);
        if (!svg) {
            console.error('SVG element not found');
            return;
        }
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const dataUri = 'data:image/svg+xml;base64,' + btoa(source);
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = `${producto.descripcion}-barcode.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const { hasEditPermission, hasDeletePermission } = usePermisos();

    const renderCell = useCallback((producto, columnKey) => {
        const cellValue = producto[columnKey];

        switch (columnKey) {
            case "descripcion":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-sm capitalize text-slate-700 dark:text-slate-200">{cellValue}</p>
                    </div>
                );
            case "nom_marca":
                return (
                    <Chip className="capitalize" size="sm" variant="flat" color="primary">
                        {cellValue}
                    </Chip>
                );
            case "nom_subcat":
                return (
                    <Chip className="capitalize" size="sm" variant="flat" color="secondary">
                        {cellValue}
                    </Chip>
                );
            case "precio":
                return (
                    <div className="font-semibold text-slate-700 dark:text-slate-200">
                        S/. {parseFloat(cellValue).toFixed(2)}
                    </div>
                );
            case "cod_barras":
                return (
                    cellValue === '-' ? <span className="text-slate-400">-</span> : (
                        <div
                            id={`barcode-${producto.id_producto}`}
                            className="flex cursor-pointer justify-center hover:opacity-70 transition-opacity"
                            onClick={() => downloadBarcode(producto)}
                            title="Clic para descargar código de barras"
                        >
                            <Barcode
                                className="bg-transparent"
                                value={cellValue}
                                width={0.9}
                                height={20}
                                fontSize={9}
                            />
                        </div>
                    )
                );
            case "estado_producto":
                const isActive = cellValue !== 'Inactivo';
                return (
                    <Chip
                        className="capitalize border-none gap-1 text-default-600"
                        color={isActive ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                        startContent={isActive ? <FaCheck size={10} /> : <FaTimes size={10} />}
                    >
                        {cellValue}
                    </Chip>
                );
            case "acciones":
                return (
                    <div className="relative flex items-center gap-2 justify-center">
                        <Tooltip content={hasEditPermission ? "Editar producto" : "No tiene permisos"}>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                radius="full"
                                color="primary"
                                onClick={() => hasEditPermission ? onEdit(producto) : null}
                                isDisabled={!hasEditPermission}
                                className="text-lg cursor-pointer active:opacity-50 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                                <MdEdit />
                            </Button>
                        </Tooltip>
                        <Tooltip color="danger" content={hasDeletePermission ? "Eliminar producto" : "No tiene permisos"}>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                radius="full"
                                color="danger"
                                onClick={() => hasDeletePermission ? handleOpenConfirmationModal(producto.descripcion, producto.id_producto) : null}
                                isDisabled={!hasDeletePermission}
                                className="text-lg cursor-pointer active:opacity-50 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
                            >
                                <FaTrash />
                            </Button>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [hasEditPermission, hasDeletePermission, onEdit]);

    return (
        <>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-4">
                <Table
                    aria-label="Tabla de productos con paginación"
                    isHeaderSticky
                    bottomContent={
                        pages > 0 ? (
                            <div className="flex w-full justify-center mt-4">
                                <Pagination
                                    isCompact
                                    showControls
                                    showShadow
                                    color="primary"
                                    page={page}
                                    total={pages}
                                    onChange={(page) => setPage(page)}
                                />
                            </div>
                        ) : null
                    }
                    classNames={{
                        wrapper: "min-h-[400px] shadow-none p-0 bg-transparent",
                        th: "bg-blue-50/50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 font-bold text-xs uppercase",
                        td: "py-3 border-b border-slate-100 dark:border-zinc-800/50",
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn
                                key={column.uid}
                                align={column.uid === "acciones" || column.uid === "cod_barras" || column.uid === "precio" ? "center" : "start"}
                            >
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={items} emptyContent={"No se encontraron productos"}>
                        {(item) => (
                            <TableRow key={item.id_producto} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal de Confirmación para eliminar Producto */}
            {isConfirmationModalOpen && (
                <ConfirmationModal
                    message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                    onClose={handleCloseConfirmationModal}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </>
    );
}

export default ShowProductos;
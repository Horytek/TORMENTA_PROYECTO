import React, { useState, useMemo, useCallback } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip, Select, SelectItem } from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { deleteProducto } from '@/services/productos.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import Barcode from '../../components/Barcode/Barcode';
import EmptyState from "@/components/Shared/EmptyState";
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

export function ShowProductos({ searchTerm, productos, onEdit, onDelete, updateProductoLocal }) {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

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
    }, [page, filteredItems, rowsPerPage]);

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
        const success = await deleteProducto(selectedId);
        if (success) {
            onDelete(selectedId);
        }
        handleCloseConfirmationModal();
    };

    const downloadBarcode = (producto) => {
        const svg = document.querySelector(`#barcode-${producto.id_producto} svg`);
        if (!svg) {
            //console.error('SVG element not found');
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
                        className="gap-1 border-none capitalize"
                        color={isActive ? "success" : "danger"}
                        size="sm"
                        variant="flat"
                        startContent={
                            <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-success-600' : 'bg-danger-600'} ml-1`}></span>
                        }
                    >
                        {isActive ? "Activo" : "Inactivo"}
                    </Chip>
                );
            case "acciones":
                return (
                    <div className="flex gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip content={hasEditPermission ? "Editar producto" : "No tiene permisos"}>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="primary"
                                onPress={() => hasEditPermission ? onEdit(producto) : null}
                                isDisabled={!hasEditPermission}
                                className="text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                            >
                                <MdEdit size={18} />
                            </Button>
                        </Tooltip>
                        <Tooltip color="danger" content={hasDeletePermission ? "Eliminar producto" : "No tiene permisos"}>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => hasDeletePermission ? handleOpenConfirmationModal(producto.descripcion, producto.id_producto) : null}
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
    }, [hasEditPermission, hasDeletePermission, onEdit]);

    return (
        <div className="w-full space-y-4">


            <Table
                aria-label="Tabla de productos con paginación"

                removeWrapper
                isHeaderSticky

                classNames={{
                    base: "max-h-[600px] overflow-scroll",
                    th: "bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 h-10",
                    td: "py-3 border-b border-slate-100 dark:border-zinc-800/50 text-slate-700 dark:text-slate-300",
                    tr: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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
                <TableBody items={items} emptyContent={<EmptyState title="No se encontraron productos" description="Intenta ajustar tus filtros de búsqueda." />}>
                    {(item) => (
                        <TableRow key={item.id_producto}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-3 mt-4">
                <div className="flex items-center gap-3 text-small text-slate-500 dark:text-slate-400 ml-2">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                        {filteredItems.length} productos
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
                        classNames={{
                            cursor: "bg-blue-600 shadow-md",
                        }}
                    />
                )}
            </div>

            {/* Modal de Confirmación para eliminar Producto */}
            {
                isConfirmationModalOpen && (
                    <ConfirmationModal
                        isOpen={true}
                        message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                        onClose={handleCloseConfirmationModal}
                        onConfirm={handleConfirmDelete}
                    />
                )
            }

            {/* Bulk Action Confirmation Modal */}


        </div >
    );
}

export default ShowProductos;
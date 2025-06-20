import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip } from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { deleteProducto } from '@/services/productos.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import Barcode from '../../components/Barcode/Barcode';
import { usePermisos } from '@/routes';

export function ShowProductos({ searchTerm, productos, onEdit, onDelete }) {
    const [currentPage, setCurrentPage] = useState(1);
    const productosPerPage = 10;

    // Filtrar productos
    const filteredProductos = productos.filter(producto =>
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
        || producto.cod_barras.toLowerCase().includes(searchTerm.toLowerCase())
        || producto.id_producto.toString().includes(searchTerm.toLowerCase())
    );

    // Productos a mostrar en la página actual
    const indexOfLastProducto = currentPage * productosPerPage;
    const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
    const currentProductos = filteredProductos.slice(indexOfFirstProducto, indexOfLastProducto);

    // Estados de modal de eliminación de producto
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

    // Función para manejar la acción de confirmación de eliminación de producto
    const handleConfirmDelete = async () => {
        await deleteProducto(selectedId);
        onDelete(selectedId);
        handleCloseConfirmationModal();
    };

    // Función para descargar código de barras
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

    return (
        <div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <Table isStriped aria-label="Productos" className="min-w-full border-collapse">
                    <TableHeader>
                        <TableColumn>DESCRIPCIÓN</TableColumn>
                        <TableColumn>LÍNEA</TableColumn>
                        <TableColumn>SUB-LÍNEA</TableColumn>
                        <TableColumn>UND. MED.</TableColumn>
                        <TableColumn>PRECIO (S/.)</TableColumn>
                        <TableColumn>COD. BARRAS</TableColumn>
                        <TableColumn>ESTADO</TableColumn>
                        <TableColumn className="w-32 text-center">ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentProductos.map((producto) => (
                            <TableRow key={producto.id_producto}>
                                <TableCell>{producto.descripcion}</TableCell>
                                <TableCell>{producto.nom_marca}</TableCell>
                                <TableCell>{producto.nom_subcat}</TableCell>
                                <TableCell>{producto.undm}</TableCell>
                                <TableCell>{producto.precio}</TableCell>
                                <TableCell>
                                    {producto.cod_barras === '-' ? '-' :
                                        <div
                                            id={`barcode-${producto.id_producto}`}
                                            className="flex cursor-pointer"
                                            onClick={() => downloadBarcode(producto)}
                                        >
                                            <Barcode
                                                className="bg-transparent"
                                                value={producto.cod_barras}
                                            />
                                        </div>
                                    }
                                </TableCell>
                                <TableCell>
                                    <Chip color={producto.estado_producto === 'Inactivo' ? "danger" : "success"} size="lg" variant="flat">
                                        {producto.estado_producto}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                        <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                color={hasEditPermission ? "warning" : "default"}
                                                onClick={() => hasEditPermission ? onEdit(producto) : null}
                                                className={hasEditPermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                                            >
                                                <MdEdit />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content={hasDeletePermission ? "Eliminar" : "No tiene permisos para eliminar"}>
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                color={hasDeletePermission ? "danger" : "default"}
                                                onClick={() => hasDeletePermission ? handleOpenConfirmationModal(producto.descripcion, producto.id_producto) : null}
                                                className={hasDeletePermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación */}
            <div className="flex justify-end mt-4">
                <Pagination
                    showControls
                    page={currentPage}
                    total={Math.ceil(filteredProductos.length / productosPerPage)}
                    onChange={(page) => setCurrentPage(page)}
                />
            </div>

            {/* Modal de Confirmación para eliminar Producto */}
            {isConfirmationModalOpen && (
                <ConfirmationModal
                    message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                    onClose={handleCloseConfirmationModal}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
}

export default ShowProductos;
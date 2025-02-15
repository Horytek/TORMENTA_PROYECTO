import { useEffect, useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip } from "@nextui-org/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getProductos, deleteProducto, getProducto } from '@/services/productos.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import ProductosForm from './ProductosForm';
import Barcode from '../../components/Barcode/Barcode';

export function ShowProductos({ searchTerm }) {
  
    // Estados de listado de productos
    const [productos, setProductos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const productosPerPage = 10;

    useEffect(() => {
        getProducts();
    }, []);

    // Obtener productos mediante API
    const getProducts = async () => {
        const data = await getProductos();
        setProductos(data);
    };

    // Filtrar productos
    const filteredProductos = productos.filter(producto =>
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Productos a mostrar en la página actual
    const indexOfLastProducto = currentPage * productosPerPage;
    const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
    const currentProductos = filteredProductos.slice(indexOfFirstProducto, indexOfLastProducto);

    // Eliminar producto mediante API
    const deleteProduct = async (id) => {
        await deleteProducto(id);
        getProducts();
    };

    // Estado de Modal de Edición de Producto
    const [activeEdit, setActiveEdit] = useState(false);
    const [initialData, setInitialData] = useState(null); // Datos iniciales del producto a editar

    const handleModalEdit = async (id_producto) => {
        const data = await getProducto(id_producto);
        if (data && data[0]) {
            setInitialData({
                id_producto: id_producto,
                data: data[0]
            });
            setActiveEdit(true); // Abre el modal solo si los datos están disponibles
        }
    };

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
    const handleConfirmDelete = () => {
        deleteProduct(selectedId); // Eliminación de producto mediante api
        handleCloseConfirmationModal();
    };

    const handleCloseModal = () => {
        setActiveEdit(false);
        setInitialData(null);
    };

    // Función para descargar código de barras
    const downloadBarcode = (producto) => {
        // Seleccionar el elemento SVG
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
                                        <Tooltip content="Editar">
                                            <Button isIconOnly variant="light" color="warning" onClick={() => handleModalEdit(producto.id_producto)}>
                                                <MdEdit />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Eliminar">
                                            <Button isIconOnly variant="light" color="danger" onClick={() => handleOpenConfirmationModal(producto.descripcion, producto.id_producto)}>
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

            {/* Modal de Editar Producto */}
            {activeEdit && (
                <ProductosForm 
                    modalTitle={'Editar Producto'} 
                    onClose={handleCloseModal}
                    initialData={initialData} 
                />
            )}
        </div>
    );
}

export default ShowProductos;
import { useEffect, useState } from 'react';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from '@/components/Pagination/Pagination';
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
                <table className="w-full text-sm divide-gray-200 rounded-lg table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-1/3 px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase">DESCRIPCIÓN</th>
                            <th className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase">LÍNEA</th>
                            <th className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase">SUB-LÍNEA</th>
                            <th className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase">UND. MED.</th>
                            <th className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase">PRECIO (S/.)</th>
                            <th className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase">COD. BARRAS</th>
                            <th className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase">ESTADO</th>
                            <th className="px-6 py-3 text-xs font-bold text-center text-gray-500 uppercase">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-gray-200">
                        {currentProductos.map((producto) => (
                            <tr className='hover:bg-gray-100' key={producto.id_producto} data-product={producto.id_producto}>
                                <td className='max-w-xs px-2 py-2 whitespace-nowrap'>{producto.descripcion}</td>
                                <td className='py-2 text-center'>{producto.nom_marca}</td>
                                <td className='py-2 text-center'>{producto.nom_subcat}</td>
                                <td className='py-2 text-center'>{producto.undm}</td>
                                <td className='py-2 text-center'>{producto.precio}</td>
                                <td className='py-2 text-center'>
                                    {producto.cod_barras === '-' ? '-' :
                                        <div
                                            id={`barcode-${producto.id_producto}`}
                                            className="flex items-center justify-center cursor-pointer"
                                            onClick={() => downloadBarcode(producto)}
                                        >
                                            <Barcode
                                                className="bg-transparent"
                                                value={producto.cod_barras}
                                            />
                                        </div>
                                    }
                                </td>
                                <td className='py-2 text-center'>
                                    <span className={
                                        producto.estado_producto === 'Inactivo'
                                        ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
                                        : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                                    }>
                                        {producto.estado_producto}
                                    </span>
                                </td>
                                <td className='py-4 text-center'>
                                    <div className="flex items-center justify-center">
                                        <button className="px-2 py-1 text-xl text-yellow-400" onClick={() => handleModalEdit(producto.id_producto)}>
                                            <MdEdit />
                                        </button>
                                        <button className="px-2 py-1 text-red-500" onClick={() => handleOpenConfirmationModal(producto.descripcion, producto.id_producto)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex justify-end mt-4">
                <div className="flex">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredProductos.length / productosPerPage)}
                        onPageChange={setCurrentPage}
                    />
                </div>
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
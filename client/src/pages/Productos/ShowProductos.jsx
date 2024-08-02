import { useEffect, useState } from 'react';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from '@/components/Pagination/Pagination';
import { getProductos, deleteProducto } from '@/services/productos.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import ProductosForm from './ProductosForm';
import Barcode from '../../components/Barcode/Barcode';

export function ShowProductos({ searchTerm }) {
  
    // Estados de listado de productos
    const [productos, setProductos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const productosPerPage = 4;

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
    const [activeEdit, setIsModalOpen] = useState(false);
    const handleModalEdit = () => {
        setIsModalOpen(!activeEdit);
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
        deleteProduct(selectedId); //Eliminación de producto mediante api
        handleCloseConfirmationModal();
    };

    return (
        <div>
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm table-auto divide-gray-200 rounded-lg">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 w-1/3 text-xs font-bold text-gray-500 uppercase text-center">DESCRIPCIÓN</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">LÍNEA</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">SUB-LÍNEA</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">UND. MED.</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">PRECIO (S/.)</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">COD. BARRAS</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">ESTADO</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">ACCIONES</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-gray-200">
                {currentProductos.map((producto) => (
                <tr className='hover:bg-gray-100' key={producto.id_producto} data-product={producto.id_producto}>
                    <td className='py-2 px-2 max-w-xs whitespace-nowrap'>{producto.descripcion}</td>
                    <td className='py-2 text-center'>{producto.nom_marca}</td>
                    <td className='py-2 text-center'>{producto.nom_subcat}</td>
                    <td className='py-2 text-center'>{producto.undm}</td>
                    <td className='py-2 text-center'>{producto.precio}</td>
                    <td className='py-2 text-center'>
                    {producto.cod_barras === '-' ? '-' :
                        <div className="flex justify-center items-center">
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
                    <div className="flex justify-center items-center">
                        <button className="px-2 py-1 text-yellow-400 text-xl" onClick={handleModalEdit}>
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
            <ProductosForm modalTitle={'Editar Producto'} onClose={handleModalEdit} />
        )}
        </div>
  )
}

export default ShowProductos;
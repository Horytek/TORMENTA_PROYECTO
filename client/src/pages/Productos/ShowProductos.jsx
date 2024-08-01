import { useEffect, useState } from 'react';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getProductos, deleteProducto } from '@/services/productos.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import ProductosForm from './ProductosForm';

export function ShowProductos() {
    // Estados de listado de productos
    const [productos, setProductos] = useState([]);
    useEffect( () => {
        getProducts();
    }, []);

    // Obtener productos
    const getProducts = async () => {
        const data = await getProductos();
        setProductos(data);
    }

    // Eliminar producto
    const deleteProduct = async (id) => {
        await deleteProducto(id);
        getProducts();
    }

    // Estado de Modal de Edición de Producto
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = () => {
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Estados de modales de eliminación de producto
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const handleOpenConfirmationModal = (row, id_producto) => {
        console.log(id_producto)
        setSelectedRow(row);
        setSelectedId(id_producto);
        setIsConfirmationModalOpen(true);
    };
    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };
    // Función para manejar la acción de confirmar eliminar
    const handleConfirmDelete = () => {
        console.log('Delete', selectedRow);
        console.log('Delete', selectedId);
        // Eliminación de producto mediante api
        deleteProduct(selectedId);
        // Abrir Toast de confirmación

        // Cerrar modal de confirmación
        handleCloseConfirmationModal();
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider">DESCRIPCIÓN</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider">LÍNEA</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider">SUB-LÍNEA</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider">UND. MED.</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider">PRECIO (S/.)</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider">COD. BARRAS</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider">ESTADO</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider">ACCIONES</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    { productos.map ( (producto) => (
                        <tr key = { producto.id_producto } data-product = { producto.id_producto } >
                            <td className='py-4'>{ producto.descripcion }</td>
                            <td className='py-4 text-center'>{ producto.nom_marca }</td>
                            <td className='py-4 text-center'>{ producto.nom_subcat }</td>
                            <td className='py-4 text-center'>{ producto.undm }</td>
                            <td className='py-4 text-center'>{ producto.precio }</td>
                            <td className='py-4 text-center'>{ producto.cod_barras }</td>
                            <td className='py-4 text-center'>
                            <span 
                            className=
                            {producto.estado_producto == 'Inactivo' 
                                ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600" 
                                : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                            }>
                            {producto.estado_producto}
                            </span>
                            </td>
                            <td className='py-4 text-center'>
                                <div className="flex justify-center items-center">
                                    <button className="px-2 py-1 text-yellow-400 text-xl" onClick={() => openModal()}>
                                        <MdEdit />
                                    </button>
                                    <button className="px-2 py-1 text-red-500" onClick={() => handleOpenConfirmationModal(producto.descripcion, producto.id_producto)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) } 
                </tbody>
            </table>

            {/* Modal de Eliminar Producto */}
            {isConfirmationModalOpen && (
            <ConfirmationModal
            message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
            onClose={handleCloseConfirmationModal}
            onConfirm={handleConfirmDelete()}
            />
            )}

            {/* Modal de Editar Producto */}
            {isModalOpen && (
                <ProductosForm modalTitle={'Editar Producto'} onClose={closeModal} />
            )}
            
        </div>
    )
}

export default ShowProductos;
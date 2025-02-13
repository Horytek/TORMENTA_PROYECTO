import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination/Pagination';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getAlmacenes, deleteAlmacen } from '@/services/almacen.services';
import AlmacenesForm from './AlmacenesForm';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';

export function ShowAlmacenes({ searchTerm }) {
    const [almacenes, setAlmacenes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const almacenesPerPage = 10;

    useEffect(() => {
        fetchAlmacenes();
    }, []);

    const fetchAlmacenes = async () => {
        const data = await getAlmacenes();
        setAlmacenes(data);
    };

    const filteredAlmacenes = almacenes.filter(almacen =>
        almacen.nom_almacen.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastAlmacen = currentPage * almacenesPerPage;
    const indexOfFirstAlmacen = indexOfLastAlmacen - almacenesPerPage;
    const currentAlmacenes = filteredAlmacenes.slice(indexOfFirstAlmacen, indexOfLastAlmacen);

    // Estado para el modal de confirmación
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    // Estado para el modal de edición
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAlmacen, setSelectedAlmacen] = useState(null);

    const handleOpenConfirmationModal = (row, id) => {
        setSelectedRow(row);
        setSelectedId(id);
        setIsConfirmationModalOpen(true);
    };

    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };

    const handleConfirmDelete = async () => {
        await deleteAlmacen(selectedId);
        fetchAlmacenes();
        handleCloseConfirmationModal();
    };

    // Función para abrir el formulario de edición con los datos del almacén seleccionado
    const handleModalEdit = (almacen) => {
        console.log("Datos enviados al modal:", almacen);
        setSelectedAlmacen({
            ...almacen,
            id_sucursal: almacen.id_sucursal || almacen.nombre_sucursal || null, // Intenta obtener el valor correcto// Asegura que no sea undefined
            estado_almacen: almacen.estado_almacen === "Activo" ? 1 : 0, // Convierte el estado a número
        });
        setIsEditModalOpen(true);
    };
    

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedAlmacen(null);
    };

    return (
        <div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm divide-gray-200 rounded-lg table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Almacen</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Sucursal</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Ubicación</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-gray-200">
                        {currentAlmacenes.map((almacen) => (
                            <tr key={almacen.id_almacen} className='hover:bg-gray-100'>
                                <td className='py-2 text-center'>{almacen.id_almacen}</td>
                                <td className='py-2 text-center'>{almacen.nom_almacen}</td>
                                <td className='py-2 text-center'>{almacen.nombre_sucursal}</td>
                                <td className='py-2 text-center'>{almacen.ubicacion}</td>
                                <td className='py-2 text-center'>
                                    <span className={
                                        almacen.estado_almacen === 'Inactivo'
                                            ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
                                            : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                                    }>
                                        {almacen.estado_almacen}
                                    </span>
                                </td>
                                <td className='py-2 text-center'>
                                    <button className="px-2 py-1 text-xl text-yellow-400" onClick={() => handleModalEdit(almacen)}>
                                        <MdEdit />
                                    </button>
                                    <button onClick={() => handleOpenConfirmationModal(almacen.nom_almacen, almacen.id_almacen)} className='text-red-500 hover:text-red-700'><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end mt-4">
                <div className="flex">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredAlmacenes.length / almacenesPerPage)}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
            
            {/* Modal de Confirmación */}
            {isConfirmationModalOpen && (
                <ConfirmationModal
                    message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                    onClose={handleCloseConfirmationModal}
                    onConfirm={handleConfirmDelete}
                />
            )}

            {/* Modal de Edición */}
            {isEditModalOpen && (
                <AlmacenesForm
                    modalTitle="Editar Almacén"
                    onClose={handleCloseEditModal}
                    initialData={{ id_almacen: selectedAlmacen.id_almacen, data: selectedAlmacen }}
                />
            )}
        </div>
    );
}

export default ShowAlmacenes;

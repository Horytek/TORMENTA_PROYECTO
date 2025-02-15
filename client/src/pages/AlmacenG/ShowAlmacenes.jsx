import { useEffect, useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip } from "@nextui-org/react";
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
                <Table aria-label="Almacenes" className="min-w-full border-collapse">
                    <TableHeader>
                        <TableColumn>ID</TableColumn>
                        <TableColumn>Almacen</TableColumn>
                        <TableColumn>Sucursal</TableColumn>
                        <TableColumn>Ubicación</TableColumn>
                        <TableColumn>Estado</TableColumn>
                        <TableColumn className="w-32 text-center">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentAlmacenes.map((almacen) => (
                            <TableRow key={almacen.id_almacen}>
                                <TableCell>{almacen.id_almacen}</TableCell>
                                <TableCell>{almacen.nom_almacen}</TableCell>
                                <TableCell>{almacen.nombre_sucursal}</TableCell>
                                <TableCell>{almacen.ubicacion}</TableCell>
                                <TableCell>
                                    <Chip color={almacen.estado_almacen === 'Inactivo' ? "danger" : "success"} size="lg" variant="flat">
                                        {almacen.estado_almacen}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                        <Tooltip content="Editar">
                                            <Button isIconOnly variant="light" color="warning" onClick={() => handleModalEdit(almacen)}>
                                                <MdEdit />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Eliminar">
                                            <Button isIconOnly variant="light" color="danger" onClick={() => handleOpenConfirmationModal(almacen.nom_almacen, almacen.id_almacen)}>
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
            <div className="flex justify-end mt-4">
                <Pagination
                    showControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredAlmacenes.length / almacenesPerPage)}
                    onPageChange={setCurrentPage}
                />
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
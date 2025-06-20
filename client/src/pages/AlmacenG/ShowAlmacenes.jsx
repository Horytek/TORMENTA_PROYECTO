import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip } from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import AlmacenesForm from './AlmacenesForm';
import { usePermisos } from '@/routes';

export function ShowAlmacenes({ searchTerm, almacenes, onEdit, onDelete }) {
    const [currentPage, setCurrentPage] = useState(1);
    const almacenesPerPage = 10;

    const filteredAlmacenes = almacenes.filter(almacen =>
        almacen.nom_almacen.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastAlmacen = currentPage * almacenesPerPage;
    const indexOfFirstAlmacen = indexOfLastAlmacen - almacenesPerPage;
    const currentAlmacenes = filteredAlmacenes.slice(indexOfFirstAlmacen, indexOfLastAlmacen);

    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

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
    // Quita esta línea: await deleteAlmacen(selectedId);
    await onDelete(selectedId); // El padre maneja la lógica y la petición
    handleCloseConfirmationModal();
};

    const handleModalEdit = (almacen) => {
        setSelectedAlmacen({
            ...almacen,
            id_sucursal: almacen.id_sucursal || almacen.nombre_sucursal || null,
            estado_almacen: almacen.estado_almacen === "Activo" ? 1 : 0,
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedAlmacen(null);
    };

    const handleEditSuccess = (updatedAlmacen) => {
        onEdit(updatedAlmacen.id_almacen, updatedAlmacen);
        handleCloseEditModal();
    };

    const { hasEditPermission, hasDeletePermission } = usePermisos();

    return (
        <div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <Table isStriped aria-label="Almacenes" className="min-w-full border-collapse">
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
                                        <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
                                            <Button 
                                                isIconOnly 
                                                variant="light" 
                                                color={hasEditPermission ? "warning" : "default"}
                                                onClick={() => hasEditPermission ? handleModalEdit(almacen) : null}
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
                                                onClick={() => hasDeletePermission ? handleOpenConfirmationModal(almacen.nom_almacen, almacen.id_almacen) : null}
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
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}

export default ShowAlmacenes;
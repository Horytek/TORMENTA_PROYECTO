import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button } from "@heroui/react";
import DestinatariosForm from './DestinatariosForm';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { usePermisos } from '@/routes';
import { deleteDestinatario } from '@/services/destinatario.services';

export function ShowDestinatarios({
    searchTerm,
    destinatarios,
    updateDestinatarioLocal,
    removeDestinatario,
    onEdit
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const destinatariosPerPage = 10;
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const { hasDeletePermission, hasEditPermission } = usePermisos();

    const filteredDestinatarios = destinatarios.filter(destinatario =>
        destinatario.destinatario.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastDestinatario = currentPage * destinatariosPerPage;
    const indexOfFirstDestinatario = indexOfLastDestinatario - destinatariosPerPage;
    const currentDestinatarios = filteredDestinatarios.slice(indexOfFirstDestinatario, indexOfLastDestinatario);

    const deleteHandler = async () => {
        if (!selectedId) return;
        await deleteDestinatario(selectedId);
        removeDestinatario(selectedId);
    };

    const handleOpenConfirmationModal = (row, id) => {
        setSelectedRow(row);
        setSelectedId(id);
        setIsConfirmationModalOpen(true);
    };

    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };

    const handleConfirmDelete = () => {
        if (!selectedId) return;
        deleteHandler();
        handleCloseConfirmationModal();
    };

    return (
        <div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <Table isStriped aria-label="Destinatarios" className="min-w-full border-collapse">
                    <TableHeader>
                        <TableColumn>DOCUMENTO</TableColumn>
                        <TableColumn>RAZÓN SOCIAL</TableColumn>
                        <TableColumn>UBICACIÓN</TableColumn>
                        <TableColumn>DIRECCIÓN</TableColumn>
                        <TableColumn>EMAIL</TableColumn>
                        <TableColumn>TELÉFONO</TableColumn>
                        <TableColumn className="w-32 text-center">ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentDestinatarios.map((destinatario) => (
                            <TableRow key={destinatario.id}>
                                <TableCell>{destinatario.documento}</TableCell>
                                <TableCell>{destinatario.destinatario}</TableCell>
                                <TableCell>{destinatario.ubicacion}</TableCell>
                                <TableCell>{destinatario.direccion}</TableCell>
                                <TableCell>{destinatario.email}</TableCell>
                                <TableCell>{destinatario.telefono}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                        <Tooltip content="Editar">
                                            <Button isIconOnly variant="light" color="warning"
                                                onClick={() => onEdit(destinatario)}
                                                disabled={!hasEditPermission}
                                                className={!hasEditPermission ? 'opacity-50 cursor-not-allowed' : ''}>
                                                <MdEdit />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Eliminar">
                                            <Button isIconOnly variant="light" color="danger"
                                                onClick={() => handleOpenConfirmationModal(destinatario.destinatario, destinatario.id)}
                                                disabled={!hasDeletePermission}
                                                className={!hasDeletePermission ? 'opacity-50 cursor-not-allowed' : ''}>
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
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredDestinatarios.length / destinatariosPerPage)}
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
        </div>
    );
}

export default ShowDestinatarios;
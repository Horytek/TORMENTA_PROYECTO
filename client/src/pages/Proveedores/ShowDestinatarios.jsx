import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, ScrollShadow } from "@heroui/react";
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
        <div className="bg-gradient-to-b from-white via-blue-50/60 to-blue-100/60 border border-blue-100 rounded-2xl shadow p-0">
            <ScrollShadow hideScrollBar className="rounded-2xl">
                <Table isStriped aria-label="Destinatarios" className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
                    <TableHeader>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">DOCUMENTO</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">RAZÓN SOCIAL</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">UBICACIÓN</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">DIRECCIÓN</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">EMAIL</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">TELÉFONO</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50 w-32 text-center">ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentDestinatarios.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                                    Sin proveedores para mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentDestinatarios.map((destinatario, idx) => (
                                <TableRow
                                    key={destinatario.id}
                                    className={`transition-colors duration-150 ${
                                        idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                                    } hover:bg-blue-100/60`}
                                >
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </ScrollShadow>
            {/* Paginación */}
            <div className="flex justify-between items-center mt-2 px-4 pb-2">
                <Pagination
                    showControls
                    page={currentPage}
                    total={Math.ceil(filteredDestinatarios.length / destinatariosPerPage)}
                    onChange={setCurrentPage}
                    color="primary"
                    size="sm"
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
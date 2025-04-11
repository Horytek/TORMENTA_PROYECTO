import { useEffect, useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip } from "@nextui-org/react";
import DestinatariosForm from './DestinatariosForm';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getDestinatarios, getDestinatario } from '@/services/destinatario.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { usePermisos } from '@/routes';


export function ShowDestinatarios({ searchTerm }) {
    const [destinatarios, setDestinatarios] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const destinatariosPerPage = 10;
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const { hasDeletePermission } = usePermisos();
    const { hasEditPermission } = usePermisos();

    useEffect(() => {
        fetchDestinatarios();
    }, []);

    const fetchDestinatarios = async () => {
        const data = await getDestinatarios();
        setDestinatarios(data);
    };

    const filteredDestinatarios = destinatarios.filter(destinatario =>
        destinatario.destinatario.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastDestinatario = currentPage * destinatariosPerPage;
    const indexOfFirstDestinatario = indexOfLastDestinatario - destinatariosPerPage;
    const currentDestinatarios = filteredDestinatarios.slice(indexOfFirstDestinatario, indexOfLastDestinatario);

    const deleteHandler = async () => {
        if (!selectedDoc) {
            console.error("Error: Documento no definido en deleteHandler.");
            return;
        }
        await deactivateDestinatario(selectedDoc);
        fetchDestinatarios();
    };

    const handleOpenConfirmationModal = (row, doc) => {
        setSelectedRow(row);
        setSelectedDoc(doc);
        setIsConfirmationModalOpen(true);
    };

    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };

    const handleConfirmDelete = () => {
        if (!selectedDoc) {
            console.error("Error: No hay documento seleccionado para eliminar.");
            return;
        }
        deleteHandler();
        handleCloseConfirmationModal();
    };

    const handleEditModal = async (doc) => {
        try {
            const data = await getDestinatario(doc);
            if (!data || Object.keys(data).length === 0) {
                console.error("Error: No se encontró el destinatario o la respuesta es inválida.");
                return;
            }
            setInitialData(data[0]);
            setIsEditModalOpen(true);
        } catch (error) {
            console.error("Error al obtener destinatario:", error);
        }
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setInitialData(null);
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
                            <TableRow key={destinatario.documento}>
                                <TableCell>{destinatario.documento}</TableCell>
                                <TableCell>{destinatario.destinatario}</TableCell>
                                <TableCell>{destinatario.ubicacion}</TableCell>
                                <TableCell>{destinatario.direccion}</TableCell>
                                <TableCell>{destinatario.email}</TableCell>
                                <TableCell>{destinatario.telefono}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                        <Tooltip content="Editar">
                                            <Button isIconOnly variant="light" color="warning" onClick={() => handleEditModal(destinatario.documento)}
                                                disabled={!hasEditPermission}
                                                className={!hasEditPermission ? 'opacity-50 cursor-not-allowed' : ''}>
                                                <MdEdit />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Eliminar">
                                            <Button isIconOnly variant="light" color="danger" onClick={() => handleOpenConfirmationModal(destinatario.destinatario, destinatario.documento)}
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

            {/* Modal de Edición */}
            {isEditModalOpen && (
                <DestinatariosForm
                    modalTitle={'Editar Destinatario'}
                    onClose={handleCloseModal}
                    initialData={initialData}
                />
            )}
        </div>
    );
}

export default ShowDestinatarios;
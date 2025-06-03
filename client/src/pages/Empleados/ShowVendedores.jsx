import { useEffect, useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip } from "@nextui-org/react";
import VendedoresForm from './VendedoresForm';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getVendedores, deactivateVendedor, getVendedor } from '@/services/vendedor.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { VscDebugDisconnect } from "react-icons/vsc";
import { PiPlugsConnected } from "react-icons/pi";
import { usePermisos } from '@/routes';

export function ShowVendedores({ searchTerm }) {
    const [vendedores, setVendedores] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPassword, setShowPassword] = useState({});
    const vendedoresPerPage = 10;
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedDni, setSelectedDni] = useState(null);
    const { hasDeletePermission } = usePermisos();
    const { hasEditPermission } = usePermisos();
    
    useEffect(() => {
        getUsers();
    }, []);

    // Obtener usuarios mediante API
    const getUsers = async () => {
        const data = await getVendedores();
        setVendedores(data);
    };

    const filteredVendedores = vendedores.filter(vendedor =>
        vendedor.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastVendedor = currentPage * vendedoresPerPage;
    const indexOfFirstVendedor = indexOfLastVendedor - vendedoresPerPage;
    const currentVendedores = filteredVendedores.slice(indexOfFirstVendedor, indexOfLastVendedor);

    // Eliminar vendedor
    const deleteHandler = async () => {
        if (!selectedDni) {
            console.error("Error: DNI no definido en deleteHandler.");
            return;
        }
        await deactivateVendedor(selectedDni);
        getUsers();
    };

    const handleOpenConfirmationModal = (row, dni) => {
        setSelectedRow(row);
        setSelectedDni(dni);
        setIsConfirmationModalOpen(true);
    };

    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };

    const handleConfirmDelete = () => {
        if (!selectedDni) {
            console.error("Error: No hay DNI seleccionado para eliminar.");
            return;
        }
        deleteHandler();
        handleCloseConfirmationModal();
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [initialData, setInitialData] = useState(null);

    const handleEditModal = async (dni) => {
        try {
            const data = await getVendedor(dni);
            if (!data || data.length === 0) {
                console.error("Error: No se encontró el vendedor o la respuesta es inválida.");
                return;
            }
            setInitialData(data[0]);
            setIsEditModalOpen(true);
        } catch (error) {
            console.error("Error al obtener vendedor:", error);
        }
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setInitialData(null);
    };

    return (
        <div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <Table isStriped aria-label="Vendedores" className="min-w-full border-collapse">
                    <TableHeader>
                        <TableColumn>DNI</TableColumn>
                        <TableColumn>Usuario</TableColumn>
                        <TableColumn>Nombre</TableColumn>
                        <TableColumn>Teléfono</TableColumn>
                        <TableColumn>Estado</TableColumn>
                        <TableColumn className="w-32 text-center">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentVendedores.map((vendedor) => (
                            <TableRow key={vendedor.dni}>
                                <TableCell>{vendedor.dni}</TableCell>
                                <TableCell>{vendedor.usua}</TableCell>
                                <TableCell>{vendedor.nombre}</TableCell>
                                <TableCell>{vendedor.telefono}</TableCell>
                                <TableCell>
                                    <Chip color={vendedor.estado_vendedor === 'Inactivo' ? "danger" : "success"} size="lg" variant="flat">
                                        {vendedor.estado_vendedor}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-2">
                                        <Tooltip content="Editar">
                                            <Button isIconOnly variant="light" color="warning" onClick={() => handleEditModal(vendedor.dni)}
                                                disabled={!hasEditPermission}
                                                className={!hasEditPermission ? 'opacity-50 cursor-not-allowed' : ''}
                                                >
                                                <MdEdit />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Eliminar">
                                            <Button isIconOnly variant="light" color="danger" onClick={() => handleOpenConfirmationModal(vendedor.nombre, vendedor.dni)}
                                                disabled={!hasDeletePermission}
                                                className={!hasDeletePermission ? 'opacity-50 cursor-not-allowed' : ''}
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

            {/* Paginación */}
            <div className="flex justify-end mt-4">
                <Pagination
                    showControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredVendedores.length / vendedoresPerPage)}
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
                <VendedoresForm
                    modalTitle={'Editar Vendedor'}
                    onClose={handleCloseModal}
                    initialData={initialData}
                />
            )}
        </div>
    );
}

export default ShowVendedores;
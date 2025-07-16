import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip, ScrollShadow } from "@heroui/react";
import VendedoresForm from './VendedoresForm';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { deactivateVendedor, getVendedor } from '@/services/vendedor.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { usePermisos } from '@/routes';

export function ShowVendedores({ searchTerm, vendedores, addVendedor, updateVendedorLocal, removeVendedor }) {
    const [currentPage, setCurrentPage] = useState(1);
    const vendedoresPerPage = 10;
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedDni, setSelectedDni] = useState(null);
    const { hasDeletePermission, hasEditPermission } = usePermisos();

    const filteredVendedores = vendedores.filter(vendedor =>
        (vendedor.nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastVendedor = currentPage * vendedoresPerPage;
    const indexOfFirstVendedor = indexOfLastVendedor - vendedoresPerPage;
    const currentVendedores = filteredVendedores.slice(indexOfFirstVendedor, indexOfLastVendedor);

    const deleteHandler = async () => {
        if (!selectedDni) return;
        await deactivateVendedor(selectedDni);
        removeVendedor(selectedDni);
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
        if (!selectedDni) return;
        deleteHandler();
        handleCloseConfirmationModal();
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [initialData, setInitialData] = useState(null);

    const handleEditModal = async (dni) => {
        try {
            const data = await getVendedor(dni);
            if (!data || data.length === 0) return;
            setInitialData(data[0]);
            setIsEditModalOpen(true);
        } catch (error) {
            // Manejo de error opcional
        }
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setInitialData(null);
    };

    const handleSuccess = (dni, updatedData) => {
        if (initialData) {
            updateVendedorLocal(dni, updatedData);
        } else {
            addVendedor(updatedData);
        }
        handleCloseModal();
    };

    return (
        <div className="bg-gradient-to-b from-white via-blue-50/60 to-blue-100/60 border border-blue-100 rounded-2xl shadow p-0">
            <ScrollShadow hideScrollBar className="rounded-2xl">
                <Table isStriped aria-label="Vendedores" className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
                    <TableHeader>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">DNI</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">Usuario</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">Nombre</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">Teléfono</TableColumn>
                        <TableColumn className="text-blue-900 font-bold bg-blue-50">Estado</TableColumn>
                        <TableColumn className="w-32 text-center text-blue-900 font-bold bg-blue-50">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentVendedores.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                                    Sin empleados para mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentVendedores.map((vendedor, idx) => (
                                <TableRow
                                    key={vendedor.dni}
                                    className={`transition-colors duration-150 ${
                                        idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                                    } hover:bg-blue-100/60`}
                                >
                                    <TableCell>{vendedor.dni}</TableCell>
                                    <TableCell>{vendedor.usua}</TableCell>
                                    <TableCell>{vendedor.nombre}</TableCell>
                                    <TableCell>{vendedor.telefono}</TableCell>
                                    <TableCell>
                                        <span className={`
                                            inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
                                            ${vendedor.estado_vendedor === 'Inactivo'
                                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"}
                                        `}>
                                            {vendedor.estado_vendedor === 'Inactivo' ? (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {vendedor.estado_vendedor}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
                                                <Button isIconOnly variant="light" color="warning"
                                                    onClick={() => hasEditPermission ? handleEditModal(vendedor.dni) : null}
                                                    disabled={!hasEditPermission}
                                                    className={!hasEditPermission ? 'opacity-50 cursor-not-allowed' : ''}
                                                >
                                                    <MdEdit />
                                                </Button>
                                            </Tooltip>
                                            <Tooltip content={hasDeletePermission ? "Eliminar" : "No tiene permisos para eliminar"}>
                                                <Button isIconOnly variant="light" color="danger"
                                                    onClick={() => hasDeletePermission ? handleOpenConfirmationModal(vendedor.nombre, vendedor.dni) : null}
                                                    disabled={!hasDeletePermission}
                                                    className={!hasDeletePermission ? 'opacity-50 cursor-not-allowed' : ''}
                                                >
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
                    total={Math.ceil(filteredVendedores.length / vendedoresPerPage)}
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
            {/* Modal de Edición */}
            {isEditModalOpen && (
                <VendedoresForm
                    modalTitle={'Editar Vendedor'}
                    onClose={handleCloseModal}
                    initialData={initialData}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}

export default ShowVendedores;
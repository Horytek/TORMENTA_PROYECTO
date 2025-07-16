import { useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Pagination, Button, Chip, ScrollShadow } from "@heroui/react";
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
        await onDelete(selectedId);
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

    // Renderizado de estado con icono
    const renderEstado = (estado) => (
        <span className={`
            inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
            ${estado === 'Inactivo'
                ? "bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"}
        `}>
            {estado === 'Inactivo' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
            ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
            {estado}
        </span>
    );

    return (
        <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-0">
            <ScrollShadow hideScrollBar className="rounded-2xl">
                <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
                    <thead>
                        <tr className="bg-blue-50 text-blue-900 text-[13px] font-bold">
                            <th className="py-2 px-2 text-left">ID</th>
                            <th className="py-2 px-2 text-left">Almacén</th>
                            <th className="py-2 px-2 text-left">Sucursal</th>
                            <th className="py-2 px-2 text-left">Ubicación</th>
                            <th className="py-2 px-2 text-center">Estado</th>
                            <th className="py-2 px-2 text-center w-32">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentAlmacenes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-gray-400">Sin almacenes para mostrar</td>
                            </tr>
                        ) : (
                            currentAlmacenes.map((almacen, idx) => (
                                <tr
                                    key={almacen.id_almacen}
                                    className={`transition-colors duration-150 ${
                                        idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                                    } hover:bg-blue-100/60`}
                                >
                                    <td className="py-1.5 px-2">{almacen.id_almacen}</td>
                                    <td className="py-1.5 px-2 font-semibold text-blue-900">{almacen.nom_almacen}</td>
                                    <td className="py-1.5 px-2">{almacen.nombre_sucursal}</td>
                                    <td className="py-1.5 px-2">{almacen.ubicacion}</td>
                                    <td className="py-1.5 px-2 text-center">
                                        {renderEstado(almacen.estado_almacen)}
                                    </td>
                                    <td className="py-1.5 px-2 text-center">
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
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </ScrollShadow>
            <div className="flex justify-between items-center mt-2 px-4 pb-2">
                <Pagination
                    showControls
                    page={currentPage}
                    total={Math.ceil(filteredAlmacenes.length / almacenesPerPage)}
                    onChange={setCurrentPage}
                    color="primary"
                    size="sm"
                />
                <div />
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
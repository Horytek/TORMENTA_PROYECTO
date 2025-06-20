import { useState, useCallback } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tooltip, Pagination, Button, Chip
} from "@heroui/react";
import { MdEdit, MdDelete } from "react-icons/md";
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import SucursalForm from './SucursalForm';
import { usePermisos } from '@/routes';

function ShowSucursales({ searchTerm, sucursales, addSucursal, updateSucursalLocal, removeSucursal }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [activeEdit, setActiveEdit] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const itemsPerPage = 10;

  const { hasEditPermission, hasDeletePermission } = usePermisos();

  // Filtrado local
  const filteredSucursales = sucursales.filter(s =>
    (s.nombre_sucursal || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentSucursales = filteredSucursales.slice(indexOfFirst, indexOfLast);

  // Modal de edición
  const handleModalEdit = (sucursal) => {
    setInitialData(sucursal);
    setActiveEdit(true);
  };

  // Modal de confirmación de eliminación
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
    removeSucursal(selectedId);
    handleCloseConfirmationModal();
  };

  // Éxito en edición
  const handleSuccessEdit = (id, updatedData) => {
    updateSucursalLocal(id, updatedData);
    setActiveEdit(false);
    setInitialData(null);
  };

  // Renderizado de celdas
  const renderCell = useCallback((sucursal, columnKey) => {
    switch (columnKey) {
      case "vendedor":
        return sucursal.nombre_vendedor;
      case "nombre":
        return sucursal.nombre_sucursal;
      case "direccion":
        return sucursal.ubicacion;
      case "estado":
        return (
          <Chip
            className="capitalize"
            color={sucursal.estado_sucursal === 0 ? "danger" : "success"}
            size="lg"
            variant="flat"
          >
            {sucursal.estado_sucursal === 0 ? 'Inactivo' : 'Activo'}
          </Chip>
        );
      case "acciones":
        return (
          <div className="flex items-center justify-center gap-2">
            <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
              <Button
                isIconOnly
                variant="light"
                color={hasEditPermission ? "warning" : "default"}
                onClick={() => hasEditPermission ? handleModalEdit(sucursal) : null}
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
                onClick={() => hasDeletePermission ? handleOpenConfirmationModal(sucursal.nombre_sucursal, sucursal.id) : null}
                className={hasDeletePermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
              >
                <MdDelete />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return sucursal[columnKey];
    }
  }, [hasEditPermission, hasDeletePermission]);

  return (
    <div>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <Table isStriped aria-label="Sucursales" className="min-w-full border-collapse">
          <TableHeader>
            <TableColumn>VENDEDOR</TableColumn>
            <TableColumn>NOMBRE</TableColumn>
            <TableColumn>DIRECCIÓN</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn className="w-32 text-center">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody>
            {currentSucursales.map((sucursal) => (
              <TableRow key={sucursal.id}>
                {["vendedor", "nombre", "direccion", "estado", "acciones"].map((columnKey) => (
                  <TableCell key={columnKey}>{renderCell(sucursal, columnKey)}</TableCell>
                ))}
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
          totalPages={Math.ceil(filteredSucursales.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal de Confirmación para eliminar */}
      {isConfirmationModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Modal de Editar Sucursal */}
      {activeEdit && (
        <SucursalForm
          modalTitle="Editar Sucursal"
          onClose={() => setActiveEdit(false)}
          initialData={initialData}
          onSuccess={(data) => handleSuccessEdit(initialData.id, data)}
        />
      )}
    </div>
  );
}

export default ShowSucursales;
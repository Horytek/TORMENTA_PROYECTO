import { useState, useCallback } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tooltip, Pagination, Button, Chip, ScrollShadow
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
        return (
          <span className="font-semibold text-blue-900">{sucursal.nombre_sucursal}</span>
        );
      case "direccion":
        return (
          <span className="text-blue-700/90">{sucursal.ubicacion}</span>
        );
      case "estado":
        return (
          <span className={`
            inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
            ${sucursal.estado_sucursal === 0
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : "bg-emerald-100 text-emerald-700 border border-emerald-200"}
          `}>
            {sucursal.estado_sucursal === 0 ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {sucursal.estado_sucursal === 0 ? 'Inactivo' : 'Activo'}
          </span>
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
    <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-0">
      <ScrollShadow hideScrollBar className="rounded-2xl">
        <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
          <thead>
            <tr className="bg-blue-50 text-blue-900 text-[13px] font-bold">
              <th className="py-2 px-2 text-left">VENDEDOR</th>
              <th className="py-2 px-2 text-left">NOMBRE</th>
              <th className="py-2 px-2 text-left">DIRECCIÓN</th>
              <th className="py-2 px-2 text-center">ESTADO</th>
              <th className="py-2 px-2 text-center w-32">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {currentSucursales.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Sin sucursales para mostrar</td>
              </tr>
            ) : (
              currentSucursales.map((sucursal, idx) => (
                <tr
                  key={sucursal.id}
                  className={`transition-colors duration-150 ${
                    idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                  } hover:bg-blue-100/60`}
                >
                  {["vendedor", "nombre", "direccion", "estado", "acciones"].map((columnKey) => (
                    <td
                      key={columnKey}
                      className={`py-1.5 px-2 ${columnKey === "estado" || columnKey === "acciones" ? "text-center" : ""}`}
                    >
                      {renderCell(sucursal, columnKey)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollShadow>
      {/* Paginación */}
      <div className="flex justify-between items-center mt-2 px-4 pb-2">
        <Pagination
          showControls
          page={currentPage}
          total={Math.ceil(filteredSucursales.length / itemsPerPage)}
          onChange={setCurrentPage}
          color="primary"
          size="sm"
        />
        <div />
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
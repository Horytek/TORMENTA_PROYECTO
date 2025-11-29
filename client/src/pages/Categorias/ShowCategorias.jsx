import React, { useState, useMemo, useCallback } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { Tooltip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Pagination, Chip } from "@heroui/react";
import { usePermisos } from "@/routes";
import {
  deleteCategoria,
  deactivateCategoria as apiDeactivateCategoria,
  updateCategoria as apiEditCategoria,
} from "@/services/categoria.services";
import EditCat from "./EditCat";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

const columns = [
  { name: "CÓDIGO", uid: "id_categoria" },
  { name: "NOMBRE", uid: "nom_categoria" },
  { name: "ESTADO", uid: "estado_categoria" },
  { name: "ACCIONES", uid: "acciones" },
];

export function ShowCategorias({
  searchTerm,
  categorias,
  onAdd,
  onEdit,
  onDelete,
  onDeactivate,
}) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [deactivateCat, setDeactivateCat] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

  const filteredItems = useMemo(() => {
    return categorias.filter((categoria) =>
      categoria.nom_categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categorias, searchTerm]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const deleteProduct = async (id) => {
    await deleteCategoria(id);
    onDelete(id);
  };

  const deactivateCategoria = async (id) => {
    await apiDeactivateCategoria(id);
    onDeactivate(id);
  };

  const handleEditCategoria = async (updatedData) => {
    try {
      const payload = {
        nom_categoria: updatedData.nom_categoria,
        estado_categoria: updatedData.estado_categoria
      };
      const ok = await apiEditCategoria(updatedData.id_categoria, payload);
      if (ok) {
        onEdit && onEdit(updatedData.id_categoria, payload);
        setIsEditModalOpen(false);
        setSelectedRow(null);
      }
    } catch (error) {
      console.error("Error al actualizar categoría en ShowCategorias:", error);
    }
  };

  const handleOpenEditModal = (id_categoria, nom_categoria, estado_categoria) => {
    setSelectedRow({ id_categoria, nom_categoria, estado_categoria });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRow(null);
  };

  const handleOpenConfirmationModal = (row, id_categoria) => {
    setSelectedRow(row);
    setSelectedId(id_categoria);
    setIsConfirmationModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedRow(null);
  };

  const handleConfirmDelete = () => {
    deleteProduct(selectedId);
    handleCloseConfirmationModal();
  };

  const handleOpenDeactivationModal = (row, id_categoria) => {
    setSelectedRow(row);
    setSelectedId(id_categoria);
    setDeactivateCat(true);
  };

  const handleCloseDeactivationModal = () => {
    setDeactivateCat(false);
    setSelectedRow(null);
  };

  const handleConfirmDeactivate = () => {
    deactivateCategoria(selectedId);
    handleCloseDeactivationModal();
  };

  const renderCell = useCallback((categoria, columnKey) => {
    const cellValue = categoria[columnKey];

    switch (columnKey) {
      case "id_categoria":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm text-slate-700 dark:text-slate-200">{cellValue}</p>
          </div>
        );
      case "nom_categoria":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize text-slate-700 dark:text-slate-200">{cellValue}</p>
          </div>
        );
      case "estado_categoria":
        const isActive = cellValue === 1;
        return (
          <Chip
            className="capitalize border-none gap-1 text-default-600"
            color={isActive ? "success" : "danger"}
            size="sm"
            variant="flat"
            startContent={isActive ? <FaCheck size={10} /> : <FaTimes size={10} />}
          >
            {isActive ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "acciones":
        return (
          <div className="relative flex items-center gap-2 justify-center">
            <Tooltip content={hasEditPermission ? "Editar" : "Sin permiso"}>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                radius="full"
                color="primary"
                onClick={() => hasEditPermission && handleOpenEditModal(categoria.id_categoria, categoria.nom_categoria, categoria.estado_categoria)}
                isDisabled={!hasEditPermission}
                className="text-lg cursor-pointer active:opacity-50 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
              >
                <MdEdit />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content={hasDeletePermission ? "Eliminar" : "Sin permiso"}>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                radius="full"
                color="danger"
                onClick={() => hasDeletePermission && handleOpenConfirmationModal(categoria.nom_categoria, categoria.id_categoria)}
                isDisabled={!hasDeletePermission}
                className="text-lg cursor-pointer active:opacity-50 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
              >
                <FaTrash />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content={hasDeactivatePermission ? "Desactivar" : "Sin permiso"}>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                radius="full"
                color="danger"
                onClick={() => hasDeactivatePermission && handleOpenDeactivationModal(categoria.nom_categoria, categoria.id_categoria)}
                isDisabled={!hasDeactivatePermission}
                className="text-lg cursor-pointer active:opacity-50 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
              >
                <MdDoNotDisturbAlt />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, [hasEditPermission, hasDeletePermission, hasDeactivatePermission]);

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-4">
        <Table
          aria-label="Tabla de Categorías"
          isHeaderSticky
          bottomContent={
            pages > 0 ? (
              <div className="flex w-full justify-center mt-4">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={pages}
                  onChange={(page) => setPage(page)}
                />
              </div>
            ) : null
          }
          classNames={{
            wrapper: "min-h-[400px] shadow-none p-0 bg-transparent",
            th: "bg-blue-50/50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 font-bold text-xs uppercase",
            td: "py-3 border-b border-slate-100 dark:border-zinc-800/50",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "acciones" || column.uid === "id_categoria" || column.uid === "estado_categoria" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={items} emptyContent={"No hay categorías correspondientes/existentes."}>
            {(item) => (
              <TableRow key={item.id_categoria} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isConfirmationModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}
      {isEditModalOpen && selectedRow && (
        <EditCat
          isOpen={isEditModalOpen}
          modalTitle={"Editar categoria"}
          onClose={handleCloseEditModal}
          initialData={selectedRow}
          onSuccess={handleEditCategoria}
        />
      )}
      {deactivateCat && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas dar de baja a "${selectedRow}"?`}
          onClose={handleCloseDeactivationModal}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </>
  );
}

export default ShowCategorias;
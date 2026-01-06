import React, { useState, useMemo, useCallback } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { Tooltip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Pagination, Chip, Select, SelectItem } from "@heroui/react";
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

  onUpdate
}) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
  }, [page, filteredItems, rowsPerPage]);

  const deleteProduct = async (id) => {
    const success = await deleteCategoria(id);
    if (success) {
      onDelete(id);
    }
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
            className="gap-1 border-none capitalize"
            color={isActive ? "success" : "danger"}
            size="sm"
            variant="flat"
            startContent={
              <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-success-600' : 'bg-danger-600'} ml-1`}></span>
            }
          >
            {isActive ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "acciones":
        return (
          <div className="flex gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
            <Tooltip content={hasEditPermission ? "Editar" : "Sin permiso"}>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="primary"
                onPress={() => hasEditPermission && handleOpenEditModal(categoria.id_categoria, categoria.nom_categoria, categoria.estado_categoria)}
                isDisabled={!hasEditPermission}
                className="text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
              >
                <MdEdit size={18} />
              </Button>
            </Tooltip>
            <Tooltip color="danger" content={hasDeletePermission ? "Eliminar" : "Sin permiso"}>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => hasDeletePermission && handleOpenConfirmationModal(categoria.nom_categoria, categoria.id_categoria)}
                isDisabled={!hasDeletePermission}
                className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
              >
                <FaTrash size={16} />
              </Button>
            </Tooltip>
            {/*
            <Tooltip color="danger" content={hasDeactivatePermission ? "Desactivar" : "Sin permiso"}>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                radius="full"
                color="danger"
                onPress={() => hasDeactivatePermission && handleOpenDeactivationModal(categoria.nom_categoria, categoria.id_categoria)}
                isDisabled={!hasDeactivatePermission}
                className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300"
              >
                <MdDoNotDisturbAlt size={18} />
              </Button>
            </Tooltip>
            */}
          </div>
        );
      default:
        return cellValue;
    }
  }, [hasEditPermission, hasDeletePermission, hasDeactivatePermission]);

  return (
    <>
      <div className="w-full space-y-4">


        <Table
          aria-label="Tabla de Categorías"

          removeWrapper
          isHeaderSticky

          classNames={{
            base: "max-h-[600px] overflow-scroll",
            th: "bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 h-10",
            td: "py-3 border-b border-slate-100 dark:border-zinc-800/50 text-slate-700 dark:text-slate-300",
            tr: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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
              <TableRow key={item.id_categoria}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-3 mt-4">
          <div className="flex items-center gap-3 text-small text-slate-500 dark:text-slate-400 ml-2">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {filteredItems.length} categorías
            </span>
            <Select
              size="sm"
              className="w-20"
              selectedKeys={[rowsPerPage.toString()]}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Filas por página"
              classNames={{
                trigger: "bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 h-8 min-h-8",
                value: "text-small font-medium text-slate-600 dark:text-slate-300"
              }}
            >
              <SelectItem key="5" value="5">5</SelectItem>
              <SelectItem key="10" value="10">10</SelectItem>
              <SelectItem key="15" value="15">15</SelectItem>
              <SelectItem key="20" value="20">20</SelectItem>
            </Select>
          </div>
          {pages > 0 && (
            <Pagination
              isCompact
              showControls
              color="primary"
              page={page}
              total={pages}
              onChange={(page) => setPage(page)}
              classNames={{
                cursor: "bg-blue-600 shadow-md",
              }}
            />
          )}
        </div>
      </div >

      {isConfirmationModalOpen && (
        <ConfirmationModal
          isOpen={true}
          message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )
      }
      {
        isEditModalOpen && selectedRow && (
          <EditCat
            isOpen={isEditModalOpen}
            modalTitle={"Editar categoria"}
            onClose={handleCloseEditModal}
            initialData={selectedRow}
            onSuccess={handleEditCategoria}
          />
        )
      }
      {
        deactivateCat && (
          <ConfirmationModal
            isOpen={true}
            message={`¿Estás seguro que deseas dar de baja a "${selectedRow}"?`}
            onClose={handleCloseDeactivationModal}
            onConfirm={handleConfirmDeactivate}
          />
        )
      }
    </>
  );
}

export default ShowCategorias;
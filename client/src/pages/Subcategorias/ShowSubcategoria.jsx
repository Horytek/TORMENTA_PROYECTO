import React, { useState, useMemo, useCallback } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { Tooltip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Pagination, Chip } from "@heroui/react";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { usePermisos } from "@/routes";

const columns = [
  { name: "CÓDIGO", uid: "id_subcategoria" },
  { name: "NOMBRE", uid: "nom_subcat" },
  { name: "ESTADO", uid: "estado_subcat" },
  { name: "ACCIONES", uid: "acciones" },
];

export function ShowSubcategorias({
  searchTerm,
  subcategorias,
  onEdit,
  onDelete,
  onDeactivate,
}) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [isDeactivationModalOpen, setIsDeactivationModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

  const filteredItems = useMemo(() => {
    return subcategorias.filter((sub_categoria) =>
      sub_categoria.nom_subcat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subcategorias, searchTerm]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const handleOpenEditModal = (subcat) => {
    onEdit(subcat);
  };

  const handleOpenConfirmationModal = (subcat) => {
    setSelectedRow(subcat);
    setIsConfirmationModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedRow(null);
  };

  const handleOpenDeactivationModal = (subcat) => {
    setSelectedRow(subcat);
    setIsDeactivationModalOpen(true);
  };

  const handleCloseDeactivationModal = () => {
    setIsDeactivationModalOpen(false);
    setSelectedRow(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedRow?.id_subcategoria) {
      await onDelete(selectedRow.id_subcategoria);
      handleCloseConfirmationModal();
    }
  };

  const handleConfirmDeactivate = async () => {
    if (selectedRow?.id_subcategoria) {
      await onDeactivate(selectedRow.id_subcategoria);
      handleCloseDeactivationModal();
    }
  };

  const renderCell = useCallback((sub_categoria, columnKey) => {
    const cellValue = sub_categoria[columnKey];

    switch (columnKey) {
      case "id_subcategoria":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm text-slate-700 dark:text-slate-200">{cellValue}</p>
          </div>
        );
      case "nom_subcat":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize text-slate-700 dark:text-slate-200">{cellValue}</p>
          </div>
        );
      case "estado_subcat":
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
                onClick={() => hasEditPermission && handleOpenEditModal(sub_categoria)}
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
                onClick={() => hasDeletePermission && handleOpenConfirmationModal(sub_categoria)}
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
                onClick={() => hasDeactivatePermission && handleOpenDeactivationModal(sub_categoria)}
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
          aria-label="Tabla de Subcategorías"
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
                align={column.uid === "acciones" || column.uid === "id_subcategoria" || column.uid === "estado_subcat" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={items} emptyContent={"No hay subcategorías correspondientes/existentes."}>
            {(item) => (
              <TableRow key={item.id_subcategoria} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isConfirmationModalOpen && selectedRow && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar "${selectedRow.nom_subcat}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}
      {isDeactivationModalOpen && selectedRow && (
        <ConfirmationModal
          message={`¿Estas seguro que deseas dar de baja a "${selectedRow.nom_subcat}"?`}
          onClose={handleCloseDeactivationModal}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </>
  );
}

export default ShowSubcategorias;
import React, { useState, useMemo, useCallback } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { Tooltip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Pagination, Chip, Select, SelectItem } from "@heroui/react";
import { usePermisos } from "@/routes";
import {
  deleteMarca,
  deactivateMarca as apiDeactivateMarca,
} from "@/services/marca.services";
import EditForm from "./EditMarca";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

const columns = [
  { name: "CÓDIGO", uid: "id_marca" },
  { name: "NOMBRE", uid: "nom_marca" },
  { name: "ESTADO", uid: "estado_marca" },
  { name: "ACCIONES", uid: "acciones" },
];

export function ShowMarcas({ searchTerm, marcas, setMarcas }) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [deactivateBrand, setDeactivateBrand] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

  const filteredItems = useMemo(() => {
    return marcas.filter((marca) =>
      marca.nom_marca.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [marcas, searchTerm]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const handleOpenEditModal = (id_marca, nom_marca, estado_marca) => {
    setSelectedRow({ id_marca, nom_marca, estado_marca });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRow(null);
  };

  const deleteProduct = async (id) => {
    const success = await deleteMarca(id);
    if (success) {
      setMarcas((prev) => prev.filter((marca) => marca.id_marca !== id));
    }
  };

  const deactivateM = async (id) => {
    const success = await apiDeactivateMarca(id);
    if (success) {
      setMarcas((prev) =>
        prev.map((marca) =>
          marca.id_marca === id ? { ...marca, estado_marca: 0 } : marca
        )
      );
    }
  };

  const handleMarcaEdit = (updatedMarca) => {
    setMarcas((prevMarcas) =>
      prevMarcas.map((marca) =>
        marca.id_marca === updatedMarca.id_marca ? { ...marca, ...updatedMarca } : marca
      )
    );
  };

  const handleOpenConfirmationModal = (row, id_marca) => {
    setSelectedRow(row);
    setSelectedId(id_marca);
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

  const handleOpenDeactivationModal = (row, id_marca) => {
    setSelectedRow(row);
    setSelectedId(id_marca);
    setDeactivateBrand(true);
  };

  const handleCloseDeactivationModal = () => {
    setDeactivateBrand(false);
    setSelectedRow(null);
  };

  const handleConfirmDeactivate = () => {
    deactivateM(selectedId);
    handleCloseDeactivationModal();
  };

  const renderCell = useCallback((marca, columnKey) => {
    const cellValue = marca[columnKey];

    switch (columnKey) {
      case "id_marca":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm text-slate-700 dark:text-slate-200">{cellValue}</p>
          </div>
        );
      case "nom_marca":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize text-slate-700 dark:text-slate-200">{cellValue}</p>
          </div>
        );
      case "estado_marca":
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
                onPress={() => hasEditPermission && handleOpenEditModal(marca.id_marca, marca.nom_marca, marca.estado_marca)}
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
                onPress={() => hasDeletePermission && handleOpenConfirmationModal(marca.nom_marca, marca.id_marca)}
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
                onPress={() => hasDeactivatePermission && handleOpenDeactivationModal(marca.nom_marca, marca.id_marca)}
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
      <div className="w-full">
        <Table
          aria-label="Tabla de Marcas"
          removeWrapper
          isHeaderSticky
          classNames={{
            base: "max-h-[600px] overflow-scroll",
            th: "bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 h-10",
            td: "py-3 border-b border-slate-100 dark:border-zinc-800/50 text-slate-700 dark:text-slate-300",
            tr: "hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "acciones" || column.uid === "id_marca" || column.uid === "estado_marca" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={items} emptyContent={"No hay marcas correspondientes/existentes."}>
            {(item) => (
              <TableRow key={item.id_marca}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex w-full justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-3 mt-4">
          <div className="flex items-center gap-3 text-small text-slate-500 dark:text-slate-400 ml-2">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {filteredItems.length} marcas
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

      {
        isConfirmationModalOpen && (
          <ConfirmationModal
            message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
            onClose={handleCloseConfirmationModal}
            onConfirm={handleConfirmDelete}
          />
        )
      }
      {
        isEditModalOpen && selectedRow && (
          <EditForm
            isOpen={isEditModalOpen}
            modalTitle={"Editar marca"}
            onClose={handleCloseEditModal}
            initialData={selectedRow}
            onMarcaEdit={handleMarcaEdit}
          />
        )
      }
      {
        deactivateBrand && (
          <ConfirmationModal
            message={`¿Estás seguro que deseas dar de baja a "${selectedRow}"?`}
            onClose={handleCloseDeactivationModal}
            onConfirm={handleConfirmDeactivate}
          />
        )
      }
    </>
  );
}

export default ShowMarcas;
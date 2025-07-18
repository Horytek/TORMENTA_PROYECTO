import { useEffect, useState } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { Tooltip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from "@heroui/react";
import Pagination from "@/components/Pagination/Pagination";
import { usePermisos } from "@/routes";
import {
  deleteMarca,
  deactivateMarca as apiDeactivateMarca,
} from "@/services/marca.services";
import EditForm from "./EditMarca";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

export function ShowMarcas({ searchTerm, marcas, setMarcas }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [deactivateBrand, setDeactivateBrand] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const productosPerPage = 10;

  const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

  const filteredProductos = marcas.filter((marca) =>
    marca.nom_marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastProducto = currentPage * productosPerPage;
  const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
  const currentProductos = filteredProductos.slice(indexOfFirstProducto, indexOfLastProducto);

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

  return (
    <>
      <Table
        isStriped
        aria-label="Tabla de Marcas"
        className="min-w-full border-collapse rounded-xl overflow-hidden text-[15px] p-4"
      >
        <TableHeader>
          <TableColumn className="py-3 px-3 text-center text-blue-900 font-bold bg-blue-50">
            CÓDIGO
          </TableColumn>
          <TableColumn className="py-3 px-3 text-center text-blue-900 font-bold bg-blue-50">
            NOMBRE
          </TableColumn>
          <TableColumn className="py-3 px-3 text-center text-blue-900 font-bold bg-blue-50">
            ESTADO
          </TableColumn>
          <TableColumn className="py-3 px-3 text-center text-blue-900 font-bold bg-blue-50">
            ACCIONES
          </TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay marcas correspondientes/existentes."}>
          {currentProductos.map((marca, idx) => (
            <TableRow
              key={marca.id_marca}
              className={`transition-colors duration-150 ${
                idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
              } hover:bg-blue-100/60`}
            >
              <TableCell className="text-center text-blue-900 font-semibold">{marca.id_marca}</TableCell>
              <TableCell className="text-center">
                <span className="inline-block px-4 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[14px] font-semibold shadow-sm">
                  {marca.nom_marca}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span
                  className={
                    marca.estado_marca === 1
                      ? "inline-flex items-center gap-x-1 py-1 px-3 rounded-full text-[13px] font-semibold bg-green-100 text-green-700 border border-green-200"
                      : "inline-flex items-center gap-x-1 py-1 px-3 rounded-full text-[13px] font-semibold bg-rose-100 text-rose-700 border border-rose-200"
                  }
                >
                  {marca.estado_marca === 1 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>
                  )}
                  {marca.estado_marca === 1 ? "Activo" : "Inactivo"}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Tooltip content={hasEditPermission ? "Editar" : "Sin permiso"}>
                  <Button
                    isIconOnly
                    variant="light"
                    color={hasEditPermission ? "warning" : "default"}
                    className={hasEditPermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                    disabled={!hasEditPermission}
                    onClick={() =>
                      hasEditPermission &&
                      handleOpenEditModal(marca.id_marca, marca.nom_marca, marca.estado_marca)
                    }
                  >
                    <MdEdit />
                  </Button>
                </Tooltip>
                <Tooltip content={hasDeletePermission ? "Eliminar" : "Sin permiso"}>
                  <Button
                    isIconOnly
                    variant="light"
                    color={hasDeletePermission ? "danger" : "default"}
                    className={hasDeletePermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                    disabled={!hasDeletePermission}
                    onClick={() =>
                      hasDeletePermission &&
                      handleOpenConfirmationModal(marca.nom_marca, marca.id_marca)
                    }
                  >
                    <FaTrash />
                  </Button>
                </Tooltip>
                <Tooltip content={hasDeactivatePermission ? "Desactivar" : "Sin permiso"}>
                  <Button
                    isIconOnly
                    variant="light"
                    color={hasDeactivatePermission ? "danger" : "default"}
                    className={hasDeactivatePermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                    disabled={!hasDeactivatePermission}
                    onClick={() =>
                      hasDeactivatePermission &&
                      handleOpenDeactivationModal(marca.nom_marca, marca.id_marca)
                    }
                  >
                    <MdDoNotDisturbAlt />
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-start">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredProductos.length / productosPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>
      {isConfirmationModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}
      {isEditModalOpen && selectedRow && (
        <EditForm
          isOpen={isEditModalOpen}
          modalTitle={"Editar marca"}
          onClose={handleCloseEditModal}
          initialData={selectedRow}
          onMarcaEdit={handleMarcaEdit}
        />
      )}
      {deactivateBrand && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas dar de baja a "${selectedRow}"?`}
          onClose={handleCloseDeactivationModal}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </>
  );
}

export default ShowMarcas;
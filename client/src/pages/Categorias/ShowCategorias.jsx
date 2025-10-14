import { useState } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from "@/components/Pagination/Pagination";
import { Tooltip, Button } from "@heroui/react";
import { usePermisos } from "@/routes";
import {
  deleteCategoria,
  deactivateCategoria as apiDeactivateCategoria,
  updateCategoria as apiEditCategoria,
} from "@/services/categoria.services";
import EditCat from "./EditCat";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

export function ShowCategorias({
  searchTerm,
  categorias,
  onAdd,
  onEdit,
  onDelete,
  onDeactivate,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [deactivateCat, setDeactivateCat] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const productosPerPage = 10;

  const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

  const filteredProductos = categorias.filter((categoria) =>
    categoria.nom_categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastProducto = currentPage * productosPerPage;
  const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
  const currentProductos = filteredProductos.slice(
    indexOfFirstProducto,
    indexOfLastProducto
  );

  // Eliminar categoría (API + local)
  const deleteProduct = async (id) => {
    await deleteCategoria(id);
    onDelete(id);
  };

  // Desactivar categoría (API + local)
  const deactivateCategoria = async (id) => {
    await apiDeactivateCategoria(id);
    onDeactivate(id);
  };

  // Editar categoría (API + local)
  const handleEditCategoria = async (updatedData) => {
    await apiEditCategoria(updatedData);
    onEdit(updatedData.id_categoria, updatedData);
    setIsEditModalOpen(false);
    setSelectedRow(null);
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

 return (
  <div>
    <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4">
      <table className="w-full text-[15px] table-auto rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-blue-50 text-blue-900 font-bold">
            <th className="py-3 px-3 text-center rounded-tl-xl">CÓDIGO</th>
            <th className="py-3 px-3 text-center">NOMBRE</th>
            <th className="py-3 px-3 text-center">ESTADO</th>
            <th className="py-3 px-3 text-center rounded-tr-xl">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {currentProductos.length > 0 ? (
            currentProductos.map((categoria, idx) => (
              <tr
                className={`transition-colors duration-150 ${
                  idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                } hover:bg-blue-100/60`}
                key={categoria.id_categoria}
                data-product={categoria.id_categoria}
              >
                <td className="py-2 text-center text-blue-900 font-semibold">{categoria.id_categoria}</td>
                <td className="py-2 text-center">
                  <span className="inline-block px-4 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[14px] font-semibold shadow-sm">
                    {categoria.nom_categoria}
                  </span>
                </td>
                <td className="py-2 text-center">
              <span
                className={
                  categoria.estado_categoria === 1
                    ? "inline-flex items-center gap-x-1 py-1 px-3 rounded-full text-[13px] font-semibold bg-green-100 text-green-700 border border-green-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/60"
                    : "inline-flex items-center gap-x-1 py-1 px-3 rounded-full text-[13px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/60"
                }
              >
                {categoria.estado_categoria === 1 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
                {categoria.estado_categoria === 1 ? "Activo" : "Inactivo"}
              </span>
              </td>
              <td className="py-2 text-center">
                <div className="flex justify-center items-center gap-2">
                  <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
                    <Button
                      isIconOnly
                      variant="light"
                      color={hasEditPermission ? "warning" : "default"}
                      onClick={() =>
                        hasEditPermission
                          ? handleOpenEditModal(
                              categoria.id_categoria,
                              categoria.nom_categoria,
                              categoria.estado_categoria
                            )
                          : null
                      }
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
                      onClick={() =>
                        hasDeletePermission
                          ? handleOpenConfirmationModal(
                              categoria.nom_categoria,
                              categoria.id_categoria
                            )
                          : null
                      }
                      className={hasDeletePermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                    >
                      <FaTrash />
                    </Button>
                  </Tooltip>
                  <Tooltip content={hasDeactivatePermission ? "Desactivar" : "No tiene permisos para desactivar"}>
                    <Button
                      isIconOnly
                      variant="light"
                      color={hasDeactivatePermission ? "danger" : "default"}
                      onClick={() =>
                        hasDeactivatePermission
                          ? handleOpenDeactivationModal(
                              categoria.nom_categoria,
                              categoria.id_categoria
                            )
                          : null
                      }
                      className={hasDeactivatePermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                    >
                      <MdDoNotDisturbAlt />
                    </Button>
                  </Tooltip>
                </div>
              </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="py-4 text-center text-slate-400">
                No hay categorías correspondientes/existentes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="flex justify-start mt-4">
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
  </div>
);
}

export default ShowCategorias;
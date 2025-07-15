import { useState } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from "@/components/Pagination/Pagination";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { Tooltip, Button } from "@heroui/react";
import { usePermisos } from "@/routes";

export function ShowSubcategorias({
  searchTerm,
  subcategorias,
  onEdit,
  onDelete,
  onDeactivate,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeactivationModalOpen, setIsDeactivationModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const productosPerPage = 10;

  const { hasEditPermission, hasDeletePermission, hasDeactivatePermission } = usePermisos();

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

  const filteredSubcategorias = subcategorias.filter((sub_categoria) =>
    sub_categoria.nom_subcat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastSubcategoria = currentPage * productosPerPage;
  const indexOfFirstSubcategoria = indexOfLastSubcategoria - productosPerPage;
  const currentSubcategorias = filteredSubcategorias.slice(
    indexOfFirstSubcategoria,
    indexOfLastSubcategoria
  );

  return (
    <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4">
  <table className="w-full text-[15px] table-auto rounded-xl overflow-hidden">
    <thead>
      <tr className="bg-blue-50 text-blue-900 font-bold">
        <th className="py-3 px-3 text-center rounded-tl-xl">CÓDIGO</th>
        <th className="py-3 px-3 text-center">CATEGORÍA</th>
        <th className="py-3 px-3 text-center">NOMBRE</th>
        <th className="py-3 px-3 text-center">ESTADO</th>
        <th className="py-3 px-3 text-center rounded-tr-xl">ACCIONES</th>
      </tr>
    </thead>
    <tbody>
      {currentSubcategorias.length > 0 ? (
        currentSubcategorias.map((sub_categoria, idx) => (
          <tr
            className={`transition-colors duration-150 ${
              idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
            } hover:bg-blue-100/60`}
            key={sub_categoria.id_subcategoria}
          >
            <td className="py-2 text-center text-blue-900 font-semibold">{sub_categoria.id_subcategoria}</td>
            <td className="py-2 text-center">
              <span className="inline-block px-4 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[14px] font-semibold shadow-sm">
                {sub_categoria.nom_categoria || "Sin categoría"}
              </span>
            </td>
            <td className="py-2 text-center">
              <span className="inline-block px-4 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[14px] font-semibold shadow-sm">
                {sub_categoria.nom_subcat}
              </span>
            </td>
            <td className="py-2 text-center">
              <span
                className={
                  sub_categoria.estado_subcat === 1
                    ? "inline-flex items-center gap-x-1 py-1 px-3 rounded-full text-[13px] font-semibold bg-green-100 text-green-700 border border-green-200"
                    : "inline-flex items-center gap-x-1 py-1 px-3 rounded-full text-[13px] font-semibold bg-rose-100 text-rose-700 border border-rose-200"
                }
              >
                {sub_categoria.estado_subcat === 1 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>
                )}
                {sub_categoria.estado_subcat === 1 ? "Activo" : "Inactivo"}
              </span>
            </td>
           <td className="py-2 text-center">
  <div className="flex justify-center items-center gap-2">
    <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
      <Button
        isIconOnly
        variant="light"
        color={hasEditPermission ? "warning" : "default"}
        onClick={() => hasEditPermission ? handleOpenEditModal(sub_categoria) : null}
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
        onClick={() => hasDeletePermission ? handleOpenConfirmationModal(sub_categoria) : null}
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
        onClick={() => hasDeactivatePermission ? handleOpenDeactivationModal(sub_categoria) : null}
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
          <td colSpan="5" className="py-4 text-center text-slate-400">
            No hay subcategorias correspondientes/existentes.
          </td>
        </tr>
      )}
    </tbody>
  </table>
  <div className="flex justify-start mt-4">
    <Pagination
      currentPage={currentPage}
      totalPages={Math.ceil(filteredSubcategorias.length / productosPerPage)}
      onPageChange={setCurrentPage}
    />
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
</div>
  );
}

export default ShowSubcategorias;
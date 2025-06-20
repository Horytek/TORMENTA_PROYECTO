import { useState } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from "@/components/Pagination/Pagination";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { Tooltip } from "@heroui/react";
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
    <div>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm table-auto divide-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">
                CODIGO
              </th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">
                CATEGORIA
              </th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">
                NOMBRE
              </th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">
                ESTADO
              </th>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-gray-200">
            {currentSubcategorias.length > 0 ? (
              currentSubcategorias.map((sub_categoria) => (
                <tr
                  className="hover:bg-gray-100"
                  key={sub_categoria.id_subcategoria}
                >
                  <td className="py-2 text-center">
                    {sub_categoria.id_subcategoria}
                  </td>
                  <td className="py-2 text-center">
                    {sub_categoria.nom_categoria || "Sin categoría"}
                  </td>
                  <td className="py-2 text-center">
                    {sub_categoria.nom_subcat}
                  </td>
                  <td className="py-2 text-center">
                    <span
                      className={
                        sub_categoria.estado_subcat === 1
                          ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                          : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
                      }
                    >
                      {sub_categoria.estado_subcat === 1
                        ? "Activo"
                        : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex justify-center items-center">
                      <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
                        <button
                          className={`px-2 py-1 ${hasEditPermission ? "text-yellow-400" : "text-gray-400"} text-xl ${!hasEditPermission ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          onClick={() => hasEditPermission ? handleOpenEditModal(sub_categoria) : null}
                        >
                          <MdEdit />
                        </button>
                      </Tooltip>
                      <Tooltip content={hasDeletePermission ? "Eliminar" : "No tiene permisos para eliminar"}>
                        <button
                          className={`px-2 py-1 ${hasDeletePermission ? "text-red-500" : "text-gray-400"} ${!hasDeletePermission ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          onClick={() => hasDeletePermission ? handleOpenConfirmationModal(sub_categoria) : null}
                        >
                          <FaTrash />
                        </button>
                      </Tooltip>
                      <Tooltip content={hasDeactivatePermission ? "Desactivar" : "No tiene permisos para desactivar"}>
                        <button
                          className={`px-3 py-1 ${hasDeactivatePermission ? "text-red-600" : "text-gray-400"} ${!hasDeactivatePermission ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          style={{ fontSize: "20px" }}
                          onClick={() => hasDeactivatePermission ? handleOpenDeactivationModal(sub_categoria) : null}
                        >
                          <MdDoNotDisturbAlt />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-4 text-center">
                  No hay subcategorias correspondientes/existentes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(
            filteredSubcategorias.length / productosPerPage
          )}
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
import { useEffect, useState } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from "@/components/Pagination/Pagination";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import EditForm from "./EditSubcat";
import { useSubcategoriasConCategoria } from './hooks/getSubcategory';
import { useDeleteSubcategoria } from './hooks/deleteFunc';
import { useDeactivateSubcategoria } from './hooks/deactivateFunc';

export function ShowSubcategorias({ searchTerm }) {
  const { subcategorias, setSubcategorias, loading, error } = useSubcategoriasConCategoria();  
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeactivationModalOpen, setIsDeactivationModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
  const [selectedRow, setSelectedRow] = useState(null); 
  const productosPerPage = 10;

  const { deleteSubcategoria, success: deleteSuccess } = useDeleteSubcategoria();
  const { deactivateSubcategoria, success: deactivateSuccess } = useDeactivateSubcategoria();

  useEffect(() => {
    if (deleteSuccess) {
      setSubcategorias((prev) =>
        prev.filter((sub_categoria) => sub_categoria.id_subcategoria !== selectedRow.id)
      );
    }
  }, [deleteSuccess, selectedRow, setSubcategorias]);

  useEffect(() => {
    if (deactivateSuccess) {
      setSubcategorias((prev) =>
        prev.map((sub_categoria) =>
          sub_categoria.id_subcategoria === selectedRow.id
            ? { ...sub_categoria, estado_subcat: 0 }
            : sub_categoria
        )
      );
    }
  }, [deactivateSuccess, selectedRow, setSubcategorias]);

  const handleOpenEditModal = (id_subcategoria, id_categoria, nom_subcat, estado_subcat, nom_categoria, estado_categoria) => {
    setSelectedRow({ id_subcategoria, id_categoria, nom_subcat, estado_subcat, nom_categoria, estado_categoria });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRow(null);
  };

  const handleOpenConfirmationModal = (id, nombre) => {
    setSelectedRow({ id, nombre });
    setIsConfirmationModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedRow(null); 
  };

  const handleOpenDeactivationModal = (id, nombre) => { 
    setSelectedRow({ id, nombre });
    setIsDeactivationModalOpen(true);
  };

  const handleCloseDeactivationModal = () => {
    setIsDeactivationModalOpen(false);
    setSelectedRow(null);
  };

  const handleConfirmDelete = () => {
    if (selectedRow?.id) {
      deleteSubcategoria(selectedRow.id);
      handleCloseConfirmationModal();
    }
  };

  const handleConfirmDeactivate = () => {
    if (selectedRow?.id) {
      deactivateSubcategoria(selectedRow.id);
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

  if (loading) {
    return <div>Cargando subcategorías...</div>;
  }

  if (error) {
    return <div>Error al cargar las subcategorías: {error.message}</div>;
  }

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
                      <button
                        className="px-2 py-1 text-yellow-400 text-xl"
                        onClick={() =>
                          handleOpenEditModal(
                            sub_categoria.id_subcategoria,
                            sub_categoria.id_categoria,
                            sub_categoria.nom_subcat,
                            sub_categoria.estado_subcat,
                            sub_categoria.nom_categoria,
                            sub_categoria.estado_categoria
                          )
                        }
                      >
                        <MdEdit />
                      </button>
                      <button
                        className="px-2 py-1 text-red-500"
                        onClick={() =>
                          handleOpenConfirmationModal(
                            sub_categoria.id_subcategoria,
                            sub_categoria.nom_subcat
                          )
                        }
                      >
                        <FaTrash />
                      </button>
                      <button
                        className="px-3 py-1 text-red-600"
                        style={{ fontSize: "20px" }}
                        onClick={() =>
                          handleOpenDeactivationModal(
                            sub_categoria.id_subcategoria,
                            sub_categoria.nom_subcat
                          )
                        }
                      >
                        <MdDoNotDisturbAlt />
                      </button>
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
          message={`¿Estás seguro que deseas eliminar "${selectedRow.nombre}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}
      {isDeactivationModalOpen && selectedRow && (
        <ConfirmationModal
          message={`¿Estas seguro que deseas dar de baja a "${selectedRow.nombre}"?`}
          onClose={handleCloseDeactivationModal}
          onConfirm={handleConfirmDeactivate}
        />
      )}
      {isEditModalOpen && selectedRow && (
        <EditForm
          isOpen={isEditModalOpen}
          modalTitle={"Editar Subcategoria"}
          onClose={handleCloseEditModal}
          initialData={selectedRow}
        />
      )}
    </div>
  );
}

export default ShowSubcategorias;

import { useEffect, useState } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from "@/components/Pagination/Pagination";
import {
  getSubcategoriaNomCategoria as fetchSubcategorias,
  deleteSubcategoria,
  deactivateSubcategoria,
} from "@/services/subcategoria.services";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

export function ShowSubcategorias({ searchTerm }) {
  const [subcategorias, setSubcategorias] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeactivationModalOpen, setIsDeactivationModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null); 
  const productosPerPage = 10;

  useEffect(() => {
    const loadSubcategorias = async () => {
      const data = await fetchSubcategorias();
      setSubcategorias(data);
    };
    loadSubcategorias();
  }, []);

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

  const handleConfirmDelete = async () => {
    if (selectedRow?.id) {
      await deleteSubcategoria(selectedRow.id);
      setSubcategorias((prev) =>
        prev.filter(
          (sub_categoria) => sub_categoria.id_subcategoria !== selectedRow.id
        )
      );
      handleCloseConfirmationModal();
    }
  };

  const handleConfirmDeactivate = async () => {
    if (selectedRow?.id) {
      await deactivateSubcategoria(selectedRow.id);
      setSubcategorias((prev) =>
        prev.map((sub_categoria) =>
          sub_categoria.id_subcategoria === selectedRow.id
            ? { ...sub_categoria, estado_subcat: 0 }
            : sub_categoria
        )
      );
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
                    {sub_categoria.categoria
                      ? sub_categoria.categoria.nom_categoria
                      : "Sin categoría"}
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
                        onClick={
                          () => console.log("Edit action") // Aquí iría la acción de editar
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
    </div>
  );
}

export default ShowSubcategorias;

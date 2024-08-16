import { useEffect, useState } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from "@/components/Pagination/Pagination";
import {
  getCategorias as fetchCategorias,
  getCategoria,
  deleteCategoria,
  deactivateCategoria as apiDeactivateCategoria,
} from "@/services/categoria.services";
import EditCat from "./EditCat";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

export function ShowCategorias({ searchTerm }) {
  const [categorias, setCategorias] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [deactivateCat, setDeactivateCat] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const productosPerPage = 10;

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    const data = await fetchCategorias();
    setCategorias(data);
  };

  const filteredProductos = categorias.filter((categoria) =>
    categoria.nom_categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastProducto = currentPage * productosPerPage;
  const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
  const currentProductos = filteredProductos.slice(
    indexOfFirstProducto,
    indexOfLastProducto
  );

  const deleteProduct = async (id) => {
    await deleteCategoria(id);
    loadCategorias();
  };

  const deactivateCategoria = async (id) => {
    await apiDeactivateCategoria(id);
    loadCategorias();
  };

  const handleOpenEditModal = (
    id_categoria,
    nom_categoria,
    estado_categoria
  ) => {
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
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm table-auto divide-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">
                CODIGO
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
            {currentProductos.length > 0 ? (
              currentProductos.map((categoria) => (
                <tr
                  className="hover:bg-gray-100"
                  key={categoria.id_categoria}
                  data-product={categoria.id_categoria}
                >
                  <td className="py-2 text-center">{categoria.id_categoria}</td>
                  <td className="py-2 text-center">
                    {categoria.nom_categoria}
                  </td>
                  <td className="py-2 text-center">
                    <span
                      className={
                        categoria.estado_categoria === 1
                          ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                          : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
                      }
                    >
                      {categoria.estado_categoria === 1 ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex justify-center items-center">
                      <button
                        className="px-2 py-1 text-yellow-400 text-xl"
                        onClick={() =>
                          handleOpenEditModal(
                            categoria.id_categoria,
                            categoria.nom_categoria,
                            categoria.estado_categoria,
                          )
                        }
                      >
                        <MdEdit />
                      </button>
                      <button
                        className="px-2 py-1 text-red-500"
                        onClick={() =>
                          handleOpenConfirmationModal(
                            categoria.nom_categoria,
                            categoria.id_categoria
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
                            categoria.nom_categoria,
                            categoria.id_categoria
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
                <td colSpan="4" className="py-4 text-center">
                  No hay categorías correspondientes/existentes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-end mt-4">
        <div className="flex">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredProductos.length / productosPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
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

import { useEffect, useState } from "react";
import { MdEdit, MdDoNotDisturbAlt } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import Pagination from "@/components/Pagination/Pagination";
import {
  getMarcas as fetchMarcas,
  getMarca,
  deleteMarca,
  deactivateMarca as apiDeactivateMarca,
} from "@/services/marca.services";
import EditForm from "./EditMarca";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

export function ShowMarcas({ searchTerm }) {
  const [marcas, setMarcas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [deactivateBrand, setDeactivateBrand] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const productosPerPage = 10;

  useEffect(() => {
    loadMarcas();
  }, []);

  const loadMarcas = async () => {
    const data = await fetchMarcas();
    setMarcas(data);
  };

  const filteredProductos = marcas.filter((marca) =>
    marca.nom_marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastProducto = currentPage * productosPerPage;
  const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
  const currentProductos = filteredProductos.slice(
    indexOfFirstProducto,
    indexOfLastProducto
  );

  const handleOpenEditModal = (id_marca, nom_marca, estado_marca) => {
    setSelectedRow({ id_marca, nom_marca, estado_marca });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRow(null);
  };

  const deleteProduct = async (id) => {
    await deleteMarca(id);
    loadMarcas();
  };

  const deactivateM = async (id) => {
    await apiDeactivateMarca(id);
    loadMarcas();
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

  const handleCloseModal = () => {
    setActiveEdit(false);
    setInitialData(null);
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
              currentProductos.map((marca) => (
                <tr
                  className="hover:bg-gray-100"
                  key={marca.id_marca}
                  data-product={marca.id_marca}
                >
                  <td className="py-2 text-center">{marca.id_marca}</td>
                  <td className="py-2 text-center">{marca.nom_marca}</td>
                  <td className="py-2 text-center">
                    <span
                      className={
                        marca.estado_marca === 1
                          ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                          : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
                      }
                    >
                      {marca.estado_marca === 1 ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex justify-center items-center">
                      <button
                        className="px-2 py-1 text-yellow-400 text-xl"
                        onClick={() =>
                          handleOpenEditModal(
                            marca.id_marca,
                            marca.nom_marca,
                            marca.estado_marca
                          )
                        }
                      >
                        <MdEdit />
                      </button>
                      <button
                        className="px-2 py-1 text-red-500"
                        onClick={() =>
                          handleOpenConfirmationModal(
                            marca.nom_marca,
                            marca.id_marca
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
                            marca.nom_marca,
                            marca.id_marca
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
                  No hay marcas correspondientes/existentes.
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
        <EditForm
          isOpen={isEditModalOpen}
          modalTitle={"Editar marca"}
          onClose={handleCloseEditModal}
          initialData={selectedRow}
        />
      )}

      {deactivateBrand && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas dar de baja a "${selectedRow}"?`}
          onClose={handleCloseDeactivationModal}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </div>
  );
}

export default ShowMarcas;

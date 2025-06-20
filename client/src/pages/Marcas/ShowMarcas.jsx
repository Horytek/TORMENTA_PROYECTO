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

// Supongamos que tienes setMarcas en tu componente padre

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
    <div>
      <Table isStriped aria-label="Tabla de Marcas">
        <TableHeader>
          <TableColumn className="text-center">CÓDIGO</TableColumn>
          <TableColumn className="text-center">NOMBRE</TableColumn>
          <TableColumn className="text-center">ESTADO</TableColumn>
          <TableColumn className="text-center">ACCIONES</TableColumn>
        </TableHeader>

        <TableBody emptyContent={"No hay marcas correspondientes/existentes."}>
          {currentProductos.map((marca) => (
            <TableRow key={marca.id_marca}>
              <TableCell className="text-center">{marca.id_marca}</TableCell>
              <TableCell className="text-center">{marca.nom_marca}</TableCell>
              <TableCell className="text-center">
                <span
                  className={
                    marca.estado_marca === 1
                      ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full bg-green-200 text-green-700 text-sm font-medium"
                      : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full bg-red-100 text-red-600 text-sm font-medium"
                  }
                >
                  {marca.estado_marca === 1 ? "Activo" : "Inactivo"}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Paginación */}
      <div className="flex justify-end mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredProductos.length / productosPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modales */}
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
    </div>
  );
}

export default ShowMarcas;

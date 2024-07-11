import { useState } from "react";
import "./Marcas.css";
import { FaSearch } from "react-icons/fa";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { MdAddCircleOutline } from "react-icons/md";
import Pagination from "@/components/Pagination/Pagination";
import TablaMarcas from "./ComponentsMarcas/MarcasTable";
import OptionsModal from "./ComponentsMarcas/Modals/OptionsModal";
import ConfirmationModal from "./ComponentsMarcas/Modals/ConfirmationModal";

const Marcas = () => {
  // Estado para manejar la lista de ventas
  const [marcas, setMarcas] = useState([
    {
      id: 1,
      serieNum: "C001",
      num: "0001",
      nombre: "Nombre de la marca 1",
      estado: "Activo",
    },
    {
      id: 2,
      serieNum: "C002",
      num: "0002",
      nombre: "Marca de ropa prueba 2",
      estado: "Inactivo",
    },
    {
      id: 3,
      serieNum: "C003",
      num: "0003",
      nombre: "Angie Chavez aprobo calidad",
      estado: "Activo",
    },
    {
      id: 4,
      serieNum: "C004",
      num: "0004",
      nombre: "Dior",
      estado: "Inactivo",
    },
    {
      id: 5,
      serieNum: "C005",
      num: "0005",
      nombre: "Ñofi",
      estado: "Activo",
    }

  ]);

  // Estado para el manejo del modal y opciones de eliminación
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5; // Número total de páginas

  // Funciones para abrir y cerrar el modal de opciones
  const openModal = (id) => {
    setSelectedRowId(id);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setSelectedRowId(null);
    setModalOpen(false);
    setDeleteOptionSelected(false);
  };

  // Función para alternar la opción de eliminar venta
  const toggleDeleteDetalleOption = () => {
    setDeleteOptionSelected(!deleteOptionSelected);
  };

  // Función para eliminar una venta
  const handleDeleteVenta = () => {
    const updatedVentas = marcas.filter((venta) => venta.id !== selectedRowId);
    setMarcas(updatedVentas);
    closeModal();
    setConfirmDeleteModalOpen(false);
  };

  // Función para cambiar de página en la paginación
  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Componente de migas de pan */}
      <Breadcrumb
        paths={[
          { name: "Inicio", href: "/inicio" },
          { name: "Marcas", href: "/marcas" },
        ]}
      />

      <hr className="mb-4" />
      {/* Encabezado principal */}
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: "36px" }}>
          Listado de marcas
        </h1>
        <div className="bg-white p-4 pb-2 flex justify-between items-center relative">
          <div className="flex items-center space-x-4">
            {/* Barra de búsqueda */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre"
                className="border rounded pl-10 pr-2 py-1"
              />
            </div>
            {/* Botón para agregar nueva marca */}
            <button className="flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 rounded-md px-4 py-2">
              <MdAddCircleOutline
                className="mr-2"
                style={{ fontSize: "20px" }}
              />
              Nueva marca
            </button>
          </div>
        </div>
      </div>

      {/* Componente de tabla de ventas */}
      <TablaMarcas
        marcas={marcas}
        modalOpen={modalOpen}
        deleteOptionSelected={deleteOptionSelected}
        openModal={openModal}
        /* currentPage={currentPage} */
      />

      {/* Modal para opciones */}
      <OptionsModal
        modalOpen={modalOpen}
        toggleDeleteDetalleOption={toggleDeleteDetalleOption}
        closeModal={closeModal}
        setConfirmDeleteModalOpen={setConfirmDeleteModalOpen}
        deleteOptionSelected={deleteOptionSelected}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        confirmDeleteModalOpen={confirmDeleteModalOpen}
        handleDeleteVenta={handleDeleteVenta}
        closeModal={closeModal}
        setConfirmDeleteModalOpen={setConfirmDeleteModalOpen}
      />
 
      {/* Contenedor para paginación */}
      <div className="flex justify-between mt-4">
        <div className="flex">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
        <select className="input cant-pag">
          <option>5</option>
          <option>10</option>
          <option>20</option>
        </select>
      </div>
    </div>
  );
};

export default Marcas;

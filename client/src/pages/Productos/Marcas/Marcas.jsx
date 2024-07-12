import { useState } from "react";
import "./Marcas.css";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { MdAddCircleOutline } from "react-icons/md";
import Pagination from "@/components/Pagination/Pagination";
import TablaMarcas from "./ComponentsMarcas/MarcasTable";
import OptionsModal from "./ComponentsMarcas/Modals/OptionsModal";
import BajaModal from "./ComponentsMarcas/Modals/BajaModal";
import ConfirmationModal from "./ComponentsMarcas/Modals/ConfirmationModal";
import RegistroModal from "./Registro_Marca/ComponentsRegistroMarcas/Modals/RegistroModal";

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
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  // Estado para el manejo del modal y opciones de eliminación
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [darBajaOptionSelected, setDarBajaOptionSelected] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const totalPages = 5; // Número total de páginas
  const filteredMarcas = marcas.filter((marca) =>
    marca.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Funciones para abrir y cerrar el modal de opciones
  const openModal = (id) => {
    setSelectedRowId(id);
    setModalOpen(true);
  };
  const darBajaModal = (id) => {
    setSelectedRowId(id);
    setModalBajaOpen(true);
  };

  const closeModal = () => {
    setSelectedRowId(null);
    setModalOpen(false);
    setDeleteOptionSelected(false);
  };
  const openRegistroModal = (title) => {
    setModalTitle(title);
    setIsModalOpen(true);
  };
  const closeRegistroModal = () => {
    setIsModalOpen(false);
  };

  const closeBajaModal = () => {
    setSelectedRowId(null);
    setModalBajaOpen(false);
    setDarBajaOptionSelected(false);
  };

  // Función para alternar la opción de eliminar venta
  const toggleDeleteDetalleOption = () => {
    setDeleteOptionSelected(!deleteOptionSelected);
  };
  const toggleDeactivateMarca = () => {
    setDarBajaOptionSelected(!darBajaOptionSelected);
  };

  // Función para eliminar una venta
  const handleDeleteVenta = () => {
    const updatedVentas = marcas.filter((venta) => venta.id !== selectedRowId);
    setMarcas(updatedVentas);
    closeModal();
    setConfirmDeleteModalOpen(false);
  };

  const handleDarBajaMarca = () => {
    const updatedMarcas = marcas.map((marca) => {
      if (marca.id === selectedRowId) {
        return { ...marca, estado: "Inactivo" };
      }
      return marca;
    });
    setMarcas(updatedMarcas);
    closeBajaModal();
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
          { name: "Marcas", href: "/productos/marcas" },
        ]}
      />

      <hr className="mb-4" />
      {/* Encabezado principal */}
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: "36px" }}>
          Marcas
          <div className="flex justify-between mt-5 mb-4">
            <h2 className="font" style={{ fontSize: "20px " }}>
              Listado de Marcas
            </h2>
          </div>
        </h1>

        <div className="bg-white p-4 pb-2 flex justify-between items-center relative">
          <div className="flex items-center space-x-4">
            {/* Barra de búsqueda */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre"
                className="border rounded pl-10 pr-3 py-2"
                onChange={(e) => setSearchTerm(e.target.value)} // Actualiza el estado con el valor del input
              />
            </div>
            {/* Botón para agregar nueva marca */}
            <button
              onClick={() => openRegistroModal("Agregar Marca")}
              className="flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 rounded-md px-4 py-2"
            >
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
        marcas={filteredMarcas}
        modalOpen={modalOpen}
        deleteOptionSelected={deleteOptionSelected}
        darBajaOptionSelected={darBajaOptionSelected}
        openModal={openModal}
        darBajaModal={darBajaModal}
        currentPage={currentPage}
      />
      <BajaModal
        modalOpen={modalBajaOpen}
        toggleDeactivateMarca={toggleDeactivateMarca}
        closeBajaModal={closeBajaModal}
        handleDarBajaMarca={handleDarBajaMarca}
        darBajaOptionSelected={darBajaOptionSelected}
      />
      {/* Modal para registro de marca */}

      {isModalOpen && (
        <RegistroModal modalTitle={modalTitle} onClose={closeRegistroModal} />
      )}
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

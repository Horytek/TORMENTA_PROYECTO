import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Marcas.css";
import "./Registro_Marca/ComponentsRegistroMarcas/Modals/RegistroModal.css";
import { FaSearch } from "react-icons/fa";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { MdAddCircleOutline } from "react-icons/md";
import Pagination from "@/components/Pagination/Pagination";
import TablaMarcas from "./ComponentsMarcas/MarcasTable";
import OptionsModal from "./ComponentsMarcas/Modals/OptionsModal";
import BajaModal from "./ComponentsMarcas/Modals/BajaModal";
import EditModal from "./ComponentsMarcas/Modals/EditModal";
import ConfirmationModal from "./ComponentsMarcas/Modals/ConfirmationModal";
import RegistroModal from "./Registro_Marca/ComponentsRegistroMarcas/Modals/RegistroModal";

const Marcas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [marcas, setMarcas] = useState([]);

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegistroModalOpen, setIsRegistroModalOpen] = useState(false);
  const [isBajaModalOpen, setIsBajaModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(5);

  useEffect(() => {
    fetchMarcas();
  }, []);

  function fetchMarcas() {
    axios
      .get("http://localhost:4000/api/marcas")
      .then((response) => {
        setMarcas(response.data.data); // Asegúrate de que estás accediendo correctamente según la estructura de la API.
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  }

  function handleAddMarca(data) {
    axios
      .post("http://localhost:4000/api/marcas", data)
      .then((response) => {
        fetchMarcas();
        setIsRegistroModalOpen(false);
      })
      .catch((error) => {
        console.error("Error adding marca: ", error);
      });
  }

  function handleUpdateMarca(data) {
    axios
      .put(`http://localhost:4000/api/marcas/${selectedRowId}`, data)
      .then((response) => {
        fetchMarcas();
        setIsEditModalOpen(false);
      })
      .catch((error) => {
        console.error("Error updating marca: ", error);
      });
  }

  function handleDeleteMarca() {
    axios
      .delete(`http://localhost:4000/api/marcas/${selectedRowId}`)
      .then((response) => {
        fetchMarcas();
        setModalOpen(false);
      })
      .catch((error) => {
        console.error("Error deleting marca: ", error);
      });
  }

  function handleDarBajaMarca() {
    axios
      .put(`http://localhost:4000/api/marcas/${selectedRowId}`, {
        estado_marca: 0,
      })
      .then((response) => {
        fetchMarcas();
        setIsBajaModalOpen(false);
      })
      .catch((error) => {
        console.error("Error updating marca: ", error);
      });
  }
  

  return (
    <div>
      <Breadcrumb
        paths={[
          { name: "Inicio", href: "/inicio" },
          { name: "Productos", href: "/productos" },
          { name: "Marcas", href: "/productos/marcas" },
        ]}
      />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: "36px" }}>
          Marcas
          <div className="flex justify-between mt-5 mb-4">
            <h2 className="font" style={{ fontSize: "16px " }}>
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
                className="border rounded pl-10 pr-20 py-2"
                onChange={(e) => setSearchTerm(e.target.value)} // Actualiza el estado con el valor del input
              />
            </div>
            {/* Botón para agregar nueva marca */}
            <button
              onClick={() => setIsRegistroModalOpen(true)}
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

      <TablaMarcas
        marcas={marcas}
        openModal={(id) => {
          setSelectedRowId(id);
          setModalOpen(true);
        }}
        openEditModal={(id) => {
          setSelectedRowId(id);
          setIsEditModalOpen(true);
        }}
        darBajaModal={(id) => {
          setSelectedRowId(id);
          setIsBajaModalOpen(true);
        }}
      />

      {isRegistroModalOpen && (
        <RegistroModal
          onClose={() => setIsRegistroModalOpen(false)}
          onSubmit={handleAddMarca}
        />
      )}
      {isEditModalOpen && (
        <EditModal
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateMarca}
          marca={marcas.find((m) => m.id === selectedRowId)}
        />
      )}
      {isBajaModalOpen && (
        <BajaModal
          onClose={() => setIsBajaModalOpen(false)}
          onConfirm={handleDarBajaMarca}
        />
      )}
      {modalOpen && (
        <OptionsModal
          onClose={() => setModalOpen(false)}
          onDelete={handleDeleteMarca}
        />
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Marcas;

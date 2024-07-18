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
  const [selectedMarca, setSelectedMarca] = useState(null);
  const [modals, setModals] = useState({
    modalOpen: false,
    isEditModalOpen: false,
    isConfirmationModalOpen: false,
    isRegistroModalOpen: false,
    isBajaModalOpen: false,
  });
  const [darBajaOptionSelected, setDarBajaOptionSelected] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(5);

  const toggleDeleteDetalleOption = () => {
    setDeleteOptionSelected(!deleteOptionSelected);
  };

  const toggleDeactivateMarca = () => {
    setDarBajaOptionSelected(!darBajaOptionSelected);
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/marcas");
      setMarcas(response.data.data);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const handleAddMarca = async (marca) => {
    try {
      await axios.post("http://localhost:4000/api/marcas", { nombre: marca });
      fetchMarcas();
      setModals((prev) => ({ ...prev, isRegistroModalOpen: false }));
    } catch (error) {
      console.error("Error añadiendo la marca: ", error);
    }
  };

  const handleUpdateMarca = async (nombre, estado) => {
    try {
      await axios.put(
        `http://localhost:4000/api/marcas/${selectedRowId}`,
        { nombre, estado }
      );
      fetchMarcas();
      setModals((prev) => ({ ...prev, isEditModalOpen: false }));
    } catch (error) {
      console.error("Error updating marca: ", error);
    }
  };

  const handleDeleteMarca = async () => {
    try {
      await axios.delete(`http://localhost:4000/api/marcas/${selectedRowId}`);
      fetchMarcas();
      setModals((prev) => ({ ...prev, modalOpen: false }));
    } catch (error) {
      console.error("Error deleting marca: ", error);
    }
  };

  const handleDarBajaMarca = async () => {
    try {
      await axios.put(`http://localhost:4000/api/marcas/${selectedRowId}`, {
        estado_marca: 0,
      });
      fetchMarcas();
      setModals((prev) => ({ ...prev, isBajaModalOpen: false }));
    } catch (error) {
      console.error("Error updating marca: ", error);
    }
  };

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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Botón para agregar nueva marca */}
            <button
              onClick={() =>
                setModals((prev) => ({ ...prev, isRegistroModalOpen: true }))
              }
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
          setModals((prev) => ({ ...prev, modalOpen: true }));
        }}
        openEditModal={(id) => {
          const selected = marcas.find((marca) => marca.id === id);
          setSelectedRowId(id);
          setSelectedMarca(selected);
          setModals((prev) => ({ ...prev, isEditModalOpen: true }));
        }}
        darBajaModal={(id) => {
          setSelectedRowId(id);
          setModals((prev) => ({ ...prev, isBajaModalOpen: true }));
        }}
        openConfirmationModal={() =>
          setModals((prev) => ({ ...prev, isConfirmationModalOpen: true }))
        }
      />

      {modals.isRegistroModalOpen && (
        <RegistroModal
          onClose={() =>
            setModals((prev) => ({ ...prev, isRegistroModalOpen: false }))
          }
          onSubmit={handleAddMarca}
        />
      )}
      {modals.isEditModalOpen && selectedMarca && (
        <EditModal
          initialName={selectedMarca ? selectedMarca.nombre : ""}
          initialStatus={selectedMarca ? selectedMarca.estado : "Activo"}
          onClose={() =>
            setModals((prev) => ({ ...prev, isEditModalOpen: false }))
          }
          onSubmit={handleUpdateMarca}
        />
      )}

      {modals.isBajaModalOpen && (
        <div className="modal-overlay">
          <BajaModal
            isBajaModalOpen={modals.isBajaModalOpen}
            toggleDeactivateMarca={toggleDeactivateMarca}
            onConfirm={handleDarBajaMarca}
            closeBajaModal={() =>
              setModals((prev) => ({ ...prev, isBajaModalOpen: false }))
            }
          />
        </div>
      )}
      {modals.modalOpen && (
        <div className="modal-overlay">
          <OptionsModal
            modalOpen={modals.modalOpen}
            toggleDeleteDetalleOption={toggleDeleteDetalleOption}
            closeModal={() =>
              setModals((prev) => ({ ...prev, modalOpen: false }))
            }
            setConfirmDeleteModalOpen={() =>
              setModals((prev) => ({
                ...prev,
                isConfirmationModalOpen: true,
              }))
            }
            deleteOptionSelected={deleteOptionSelected}
          />
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      {modals.isConfirmationModalOpen && (
        <ConfirmationModal
          onClose={() =>
            setModals((prev) => ({ ...prev, isConfirmationModalOpen: false }))
          }
          onConfirm={handleDeleteMarca}
        />
      )}
    </div>
  );
};

export default Marcas;

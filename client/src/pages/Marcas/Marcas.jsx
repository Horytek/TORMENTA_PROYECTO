import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import "./Marcas.css";
import "./Registro_Marca/ComponentsRegistroMarcas/Modals/RegistroModal.css";
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { ButtonNormal } from '@/components/Buttons/Buttons';
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
  const [currentPageMarcas, setCurrentPageMarcas] = useState([]);
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
  const [marcasPerPage, setMarcasPerPage] = useState(5);

  const toggleDeleteDetalleOption = () => {
    setDeleteOptionSelected(!deleteOptionSelected);
  };

  const toggleDeactivateMarca = () => {
    setDarBajaOptionSelected(!darBajaOptionSelected);
  };

  const closeModal = () => {
    setDeleteOptionSelected(false);
    setModals((prev) => ({ ...prev, modalOpen: false }));
  };

  const openOptionsModal = (id) => {
    setSelectedRowId(id);
    setDeleteOptionSelected(false); // Resetea el estado al abrir el modal
    setModals((prev) => ({ ...prev, modalOpen: true }));
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  useEffect(() => {
    const filteredMarcas = marcas.filter((marca) =>
      marca.nom_marca.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const indexOfLastMarca = currentPage * marcasPerPage;
    const indexOfFirstMarca = indexOfLastMarca - marcasPerPage;
    setCurrentPageMarcas(
      filteredMarcas.slice(indexOfFirstMarca, indexOfLastMarca)
    );
  }, [currentPage, marcas, marcasPerPage, searchTerm]);

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
      await axios.post("http://localhost:4000/api/marcas", {
        nom_marca: marca,
        estado_marca: 1,
      });
      fetchMarcas();
      setModals((prev) => ({ ...prev, isRegistroModalOpen: false }));
    } catch (error) {
      console.error("Error añadiendo la marca: ", error);
    }
  };

  const handleUpdateMarca = async (nombre, estado) => {
    try {
      const estadoMarca = estado === "Activo" ? 1 : 0;
      await axios.put(
        `http://localhost:4000/api/marcas/update/${selectedRowId}`,
        {
          nom_marca: nombre,
          estado_marca: estadoMarca,
        }
      );
      fetchMarcas();
      setModals((prev) => ({ ...prev, isEditModalOpen: false }));
      toast.success("Marca actualizada con éxito");
    } catch (error) {
      console.error("Error actualizando la marca: ", error);
      toast.error("Error al actualizar la marca");
    }
  };

  const handleDeleteMarca = async () => {
    try {
      await axios.delete(`http://localhost:4000/api/marcas/${selectedRowId}`);
      fetchMarcas();
      setModals((prev) => ({ ...prev, modalOpen: false }));
      toast.success("Marca eliminada con éxito");
    } catch (error) {
      console.error("Error eliminando la marca: ", error);
      toast.error("Error al eliminar la marca");
    }
  };

  const handleDarBajaMarca = async () => {
    try {
      await axios.put(
        `http://localhost:4000/api/marcas/deactivate/${selectedRowId}`,
        {
          estado_marca: 0,
        }
      );
      fetchMarcas();
      setModals((prev) => ({ ...prev, isBajaModalOpen: false }));
      toast.success("Marca dada de baja con éxito");
    } catch (error) {
      console.error("Error dando de baja la marca: ", error);
    }
  };

  return (
    <div>
      <Toaster />
      <Breadcrumb
        paths={[
          { name: "Inicio", href: "/inicio" },
          { name: "Productos", href: "/productos" },
          { name: "Marcas", href: "/productos/marcas" },
        ]}
      />
      <hr className="mb-4" />

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
              <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre"
                className="border rounded-lg pl-10 pr-20 py-2 border-gray-300"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-5">
              <ButtonNormal color={"#01BDD6"}>Filtrar</ButtonNormal>
            </div>
            {/* Botón para agregar nueva marca */}
            <button
              onClick={() =>
                setModals((prev) => ({ ...prev, isRegistroModalOpen: true }))
              }
              className="flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 rounded-md px-5 py-2"
            >
              <FaPlus className="mr-2" style={{ fontSize: "20px" }} />
              Nueva marca
            </button>
          </div>
        </div>
      </div>

      <TablaMarcas
        marcas={currentPageMarcas}
        openModal={openOptionsModal}
        openEditModal={(id) => {
          const selected = marcas.find((marca) => marca.id_marca === id);
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
          initialName={selectedMarca ? selectedMarca.nom_marca : ""}
          initialStatus={
            selectedMarca
              ? selectedMarca.estado_marca === 1
                ? "Activo"
                : "Inactivo"
              : "Activo"
          }
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
            closeModal={closeModal}
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

      <div className="flex justify-between items-center">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(marcas.length / marcasPerPage)}
          onPageChange={setCurrentPage}
        />
        <select
          className="cant-pag-c w-20 border-gray-300 bg-gray-50 rounded-lg"
          value={marcasPerPage}
          onChange={(e) => setMarcasPerPage(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      {modals.isConfirmationModalOpen && (
        <div className="modal-overlay">
          <ConfirmationModal
            confirmDeleteModalOpen={modals.isConfirmationModalOpen}
            handleDeleteMarca={handleDeleteMarca}
            setConfirmDeleteModalOpen={(value) =>
              setModals((prev) => ({ ...prev, isConfirmationModalOpen: value }))
            }
          />
        </div>
      )}
    </div>
  );
};

export default Marcas;

import { useState, useEffect } from "react";
import MarcasForm from "./MarcasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowMarcas } from "./ShowMarcas";
import { usePermisos } from '@/routes';
import { Button } from "@heroui/button";
import { getMarcas } from "@/services/marca.services";

function Marcas() {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);

  const { hasCreatePermission } = usePermisos();
  const [searchTerm, setSearchTerm] = useState("");

  // Estado de marcas
  const [marcas, setMarcas] = useState([]);

  // Cargar marcas solo una vez
  useEffect(() => {
    const fetchMarcas = async () => {
      const data = await getMarcas();
      setMarcas(data || []);
    };
    fetchMarcas();
  }, []);

  // Agregar marca al array local
  const handleAddMarca = (nuevaMarca) => {
    setMarcas(prev => [nuevaMarca, ...prev]);
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");

  return (
    <div className="min-h-screen py-8 px-2 sm:px-6 bg-gradient-to-b from-white via-blue-50 to-blue-100">
      <Toaster />
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header y acciones */}
        <div className="bg-white/80 border border-blue-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Gestión de marcas</h1>
            <p className="text-base text-blue-700/80">Administra y busca marcas fácilmente.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
          <BarraSearch
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Ingrese la marca a buscar"
            isClearable={true}
            onClear={handleClearSearch}
            className="h-10 text-sm w-full md:w-72"
          />
            <Button
              color="primary"
              endContent={<FaPlus style={{ fontSize: '22px' }} />}
              onClick={handleModalAdd}
              disabled={!hasCreatePermission}
              className={`h-10 px-5 font-semibold rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Agregar marca
            </Button>
          </div>
        </div>
        {/* Tabla/listado */}
        <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4">
          <ShowMarcas searchTerm={searchTerm} marcas={marcas} setMarcas={setMarcas} />
        </div>
      </div>
      <MarcasForm 
        modalTitle={'Nueva marca'} 
        isVisible={activeAdd}
        onClose={handleModalAdd}
        onAddMarca={handleAddMarca}
      />
    </div>
  );
}

export default Marcas;
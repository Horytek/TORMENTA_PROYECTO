import { useState, useEffect } from "react";
import MarcasForm from "./MarcasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowMarcas } from "./ShowMarcas";
import { usePermisos } from '@/routes';
import { Button } from "@heroui/button";
import { getMarcas } from "@/services/marca.services";

function Marcas({ 
  marcasData = null, 
  onAdd = null, 
  onUpdate = null, 
  onDelete = null, 
  skipApiCall = false 
}) {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);

  const { hasCreatePermission } = usePermisos();
  const [searchTerm, setSearchTerm] = useState("");

  // Estado de marcas - usar datos externos si están disponibles
  const [marcas, setMarcas] = useState(marcasData || []);

  // Cargar marcas solo si no se pasan datos externos
  useEffect(() => {
    if (!skipApiCall && !marcasData) {
      const fetchMarcas = async () => {
        const data = await getMarcas();
        setMarcas(data || []);
      };
      fetchMarcas();
    } else if (marcasData) {
      setMarcas(marcasData);
    }
  }, [skipApiCall, marcasData]);

  // Agregar marca al array local
  const handleAddMarca = (nuevaMarca) => {
    if (onAdd) {
      onAdd(nuevaMarca); // Usar callback externo
    } else {
      setMarcas(prev => [nuevaMarca, ...prev]); // Fallback local
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");

return (
  <div className="m-4">
    <Toaster />
    <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Gestión de marcas</h1>
    <p className="text-base text-blue-700/80 mb-4">Administra y busca marcas fácilmente.</p>
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
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
    <ShowMarcas searchTerm={searchTerm} marcas={marcas} setMarcas={setMarcas} />
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
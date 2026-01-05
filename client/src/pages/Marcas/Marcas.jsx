import { useState, useEffect } from "react";
import MarcasForm from "./MarcasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowMarcas } from "./ShowMarcas";
import { usePermisos } from '@/routes';
import { Button } from '@heroui/react';
import { getMarcas } from "@/services/marca.services";
import { ActionButton } from "@/components/Buttons/Buttons";

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
    <div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <BarraSearch
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar marca..."
          isClearable={true}
          onClear={handleClearSearch}
          className="h-10 text-sm w-full md:w-72 dark:bg-gray-800 dark:text-white"
        />
        <ActionButton
          color="primary"
          endContent={<FaPlus size={18} />}
          onClick={handleModalAdd}
          disabled={!hasCreatePermission}
          className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none 
            bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors 
            dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 
            ${!hasCreatePermission ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Agregar marca
        </ActionButton>
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
import { useState } from "react";
import CategoriasForm from "./CategoriasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowCategorias } from "./ShowCategorias";
import { usePermisos } from '@/routes';
import { Button } from '@heroui/react';
import { ActionButton } from "@/components/Buttons/Buttons";

function Categorias({
  categoriasData = [],
  onAdd = null,
  onUpdate = null,
  onDelete = null,
  skipApiCall = false
}) {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);

  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");
  const { hasCreatePermission } = usePermisos();

  // Usar directamente el array recibido del padre (persistente)
  const categorias = categoriasData;

  // Callbacks (el padre actualiza el array real)
  const addCategoriaLocal = (nuevaCategoria) => onAdd && onAdd(nuevaCategoria);
  const updateCategoriaLocal = (id_categoria, updatedData) => onUpdate && onUpdate(id_categoria, updatedData);
  const removeCategoriaLocal = (id_categoria) => onDelete && onDelete(id_categoria);
  const deactivateCategoriaLocal = (id_categoria) => {
    updateCategoriaLocal(id_categoria, { estado_categoria: 0 });
  };

  return (
    <div>
      <Toaster />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <BarraSearch
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar categoría..."
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
          Agregar categoría
        </ActionButton>
      </div>

      <ShowCategorias
        searchTerm={searchTerm}
        categorias={categorias}
        onAdd={addCategoriaLocal}
        onEdit={updateCategoriaLocal}
        onDelete={removeCategoriaLocal}
        onDeactivate={deactivateCategoriaLocal}
      />

      {activeAdd && (
        <CategoriasForm
          modalTitle={"Nueva categoría"}
          onClose={handleModalAdd}
          onSuccess={addCategoriaLocal}
        />
      )}
    </div>
  );
}

export default Categorias;
import { useState } from "react";
import CategoriasForm from "./CategoriasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowCategorias } from "./ShowCategorias";
import { usePermisos } from '@/routes';
import { Button } from '@heroui/react';

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
    <div className="m-4">      
      <Toaster />
      <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Gestión de categorías</h1>
      <p className="text-base text-blue-700/80 mb-4">Administra y busca categorías fácilmente.</p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <BarraSearch
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Ingrese la categoría a buscar"
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
          Agregar categoría
        </Button>
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
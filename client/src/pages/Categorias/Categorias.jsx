import { useState, useEffect } from "react";
import CategoriasForm from "./CategoriasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowCategorias } from "./ShowCategorias";
import { usePermisos } from '@/routes';
import { Button } from "@heroui/button";
import { getCategorias } from "@/services/categoria.services";

function Categorias({ 
  categoriasData = null, 
  onAdd = null, 
  onUpdate = null, 
  onDelete = null, 
  skipApiCall = false 
}) {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);

  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const { hasCreatePermission } = usePermisos();

  // Estado local de categorías - usar datos externos si están disponibles
  const [categorias, setCategorias] = useState(categoriasData || []);

  // Cargar categorías solo si no se pasan datos externos
  useEffect(() => {
    if (!skipApiCall && !categoriasData) {
      const fetchData = async () => {
        const data = await getCategorias();
        setCategorias(data || []);
      };
      fetchData();
    } else if (categoriasData) {
      setCategorias(categoriasData);
    }
  }, [skipApiCall, categoriasData]);

  // Agregar categoría localmente
  const addCategoriaLocal = (nuevaCategoria) => {
    if (onAdd) {
      onAdd(nuevaCategoria); // Usar callback externo
    } else {
      setCategorias(prev => [nuevaCategoria, ...prev]); // Fallback local
    }
  };

  // Editar categoría localmente
  const updateCategoriaLocal = (id_categoria, updatedData) => {
    setCategorias(prev =>
      prev.map(cat =>
        cat.id_categoria === id_categoria ? { ...cat, ...updatedData } : cat
      )
    );
  };

  // Eliminar categoría localmente
  const removeCategoriaLocal = (id_categoria) => {
    setCategorias(prev => prev.filter(cat => cat.id_categoria !== id_categoria));
  };

  // Desactivar categoría localmente
  const deactivateCategoriaLocal = (id_categoria) => {
    setCategorias(prev =>
      prev.map(cat =>
        cat.id_categoria === id_categoria ? { ...cat, estado_categoria: 0 } : cat
      )
    );
  };

  const handleClearSearch = () => setSearchTerm(""); 

  return (
<div className="m-4">      
  <Toaster />
        {/* Header y acciones */}
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
        {/* Tabla/listado */}
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
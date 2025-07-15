import { useState, useEffect } from "react";
import CategoriasForm from "./CategoriasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowCategorias } from "./ShowCategorias";
import { usePermisos } from '@/routes';
import { Button } from "@heroui/button";
import { getCategorias } from "@/services/categoria.services";

function Categorias() {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);

  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const { hasCreatePermission } = usePermisos();

  // Estado local de categorías
  const [categorias, setCategorias] = useState([]);

  // Cargar solo una vez
  useEffect(() => {
    const fetchData = async () => {
      const data = await getCategorias();
      setCategorias(data || []);
    };
    fetchData();
  }, []);

  // Agregar categoría localmente
  const addCategoriaLocal = (nuevaCategoria) => {
    setCategorias(prev => [nuevaCategoria, ...prev]);
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
    <div className="min-h-screen py-8 px-2 sm:px-6 bg-gradient-to-b from-white via-blue-50 to-blue-100">
      <Toaster />
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header y acciones */}
        <div className="bg-white/80 border border-blue-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Gestión de categorías</h1>
            <p className="text-base text-blue-700/80">Administra y busca categorías fácilmente.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
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
        </div>
        {/* Tabla/listado */}
        <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4">
          <ShowCategorias
            searchTerm={searchTerm}
            categorias={categorias}
            onAdd={addCategoriaLocal}
            onEdit={updateCategoriaLocal}
            onDelete={removeCategoriaLocal}
            onDeactivate={deactivateCategoriaLocal}
          />
        </div>
      </div>
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
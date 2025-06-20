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
    <div>
      <Toaster />
      <h1 className="font-extrabold text-4xl">Gestión de categorias</h1>
      <div className="flex justify-between mt-5 mb-4 items-center">
        <div id="barcode-scanner" hidden style={{ width: "100%", height: "400px" }}></div>
        <h6 className="font-bold">Lista de Categorias</h6>
        <div className="flex items-center gap-4 ml-auto">
          <div className="relative">
            <BarraSearch
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Ingrese la categoria a buscar"
              isClearable={true}
              onClear={handleClearSearch}
            />
          </div>
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={handleModalAdd}
            disabled={!hasCreatePermission}
            className={`${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Agregar categoria
          </Button>
        </div>
      </div>
      <div>
        <ShowCategorias
          searchTerm={searchTerm}
          categorias={categorias}
          onAdd={addCategoriaLocal}
          onEdit={updateCategoriaLocal}
          onDelete={removeCategoriaLocal}
          onDeactivate={deactivateCategoriaLocal}
        />
      </div>
      {activeAdd && (
        <CategoriasForm
          modalTitle={"Nueva categoria"}
          onClose={handleModalAdd}
          onSuccess={addCategoriaLocal}
        />
      )}
    </div>
  );
}

export default Categorias;
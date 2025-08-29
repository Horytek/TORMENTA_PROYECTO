import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import SubcategoriaForm from "./SubcategoriaForm";
import ShowSubcategorias from "./ShowSubcategoria";
import { usePermisos } from '@/routes';
import { Button } from "@heroui/button";
import {
  useSubcategoriasConCategoria as getSubcategoriasConCategoria,
  addSubcategoria,
  updateSubcategoria,
  useDeleteSubcategoria,
  useDeactivateSubcategoria
} from "@/services/subcategoria.services";
import { useCategorias } from '@/context/Categoria/CategoriaProvider';
import EditForm from "./EditSubcat";

function Subcategorias({ 
  subcategoriasData = null, 
  categoriasData = null,
  onAdd = null, 
  onUpdate = null, 
  onDelete = null, 
  skipApiCall = false 
}) {
  // Solo usar el hook si no tenemos datos externos
  const { subcategorias: subcategoriasApi, loading } = skipApiCall ? 
    { subcategorias: [], loading: false } : 
    getSubcategoriasConCategoria();
    
  const [subcategorias, setSubcategorias] = useState(subcategoriasData || []);
  const { categorias, loadCategorias } = useCategorias();
  const [activeAdd, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const { deleteSubcategoria } = useDeleteSubcategoria();
  const { deactivateSubcategoria } = useDeactivateSubcategoria();
  const { hasCreatePermission } = usePermisos();

  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");

  useEffect(() => {
    if (skipApiCall && subcategoriasData) {
      // Usar datos externos
      setSubcategorias(subcategoriasData);
    } else if (!loading && subcategorias.length === 0 && Array.isArray(subcategoriasApi)) {
      // Usar datos de la API
      setSubcategorias(subcategoriasApi);
    }
    // eslint-disable-next-line
  }, [loading, subcategoriasApi, skipApiCall, subcategoriasData]);

  useEffect(() => {
    if (!skipApiCall) {
      loadCategorias();
    }
  }, [skipApiCall]);

  // Agregar subcategoría localmente
  const handleAddSubcategoria = async (newSubcat) => {
    const [ok, id] = await addSubcategoria(newSubcat);
    if (ok) {
      setSubcategorias(prev => [
        { ...newSubcat, id_subcategoria: id, nom_categoria: getCategoriaNombre(newSubcat.id_categoria), estado_subcat: 1 },
        ...prev
      ]);
      setModalOpen(false);
    }
  };

  // Editar subcategoría localmente
  const handleEditSubcategoria = async (updatedData) => {
    const ok = await updateSubcategoria(updatedData.id_subcategoria, updatedData);
    if (ok) {
      setSubcategorias(prev =>
        prev.map(subcat =>
          subcat.id_subcategoria === updatedData.id_subcategoria
            ? {
                ...subcat,
                ...updatedData,
                nom_categoria: getCategoriaNombre(updatedData.id_categoria),
                estado_subcat: updatedData.estado_subcat
              }
            : subcat
        )
      );
      setEditModal({ open: false, data: null });
    }
  };

  // Eliminar subcategoría localmente
  const handleDeleteSubcategoria = async (id) => {
    const ok = await deleteSubcategoria(id);
    if (ok) {
      setSubcategorias(prev =>
        prev.filter(subcat => subcat.id_subcategoria !== id)
      );
    }
  };

  const handleDeactivateSubcategoria = async (id) => {
    const ok = await deactivateSubcategoria(id);
    if (ok) {
      setSubcategorias(prev =>
        prev.map(subcat =>
          subcat.id_subcategoria === id
            ? { ...subcat, estado_subcat: 0 }
            : subcat
        )
      );
    }
  };

  // Utilidad para obtener el nombre de la categoría por id_categoria
  const getCategoriaNombre = (id_categoria) => {
    const cat = categorias.find(c => parseInt(c.id_categoria) === parseInt(id_categoria));
    return cat ? cat.nom_categoria : "";
  };

  // Filtro visual
  const filteredSubcategorias = subcategorias.filter((subcat) =>
    subcat.nom_subcat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="m-4">
      <Toaster />
      <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Gestión de subcategorías</h1>
      <p className="text-base text-blue-700/80 mb-4">Administra y busca subcategorías fácilmente.</p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <BarraSearch
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Ingrese la subcategoría a buscar"
          isClearable={true}
          onClear={handleClearSearch}
          className="h-10 text-sm w-full md:w-72"
        />
        <Button
          color="primary"
          endContent={<FaPlus style={{ fontSize: '22px' }} />}
          onClick={() => setModalOpen(true)}
          disabled={!hasCreatePermission}
          className={`h-10 px-5 font-semibold rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Agregar subcategoría
        </Button>
      </div>
      <ShowSubcategorias
        searchTerm={searchTerm}
        subcategorias={subcategorias}
        onEdit={(data) => setEditModal({ open: true, data })}
        onDelete={handleDeleteSubcategoria}
        onDeactivate={handleDeactivateSubcategoria}
      />
      {activeAdd && (
        <SubcategoriaForm
          modalTitle={"Nueva subcategoría"}
          closeModal={() => setModalOpen(false)}
          onSuccess={handleAddSubcategoria}
          categorias={categorias}
        />
      )}
      {editModal.open && (
        <EditForm
          isOpen={editModal.open}
          modalTitle="Editar Subcategoría"
          onClose={() => setEditModal({ open: false, data: null })}
          initialData={editModal.data}
          onSuccess={handleEditSubcategoria}
          categorias={categorias}
        />
      )}
    </div>
  );
}

export default Subcategorias;
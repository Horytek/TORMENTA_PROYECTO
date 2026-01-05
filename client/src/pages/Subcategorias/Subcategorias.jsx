import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import SubcategoriaForm from "./SubcategoriaForm";
import ShowSubcategorias from "./ShowSubcategoria";
import { usePermisos } from '@/routes';
import { Button } from '@heroui/react';
import {
  addSubcategoria,
  updateSubcategoria,
  useDeleteSubcategoria,
  useDeactivateSubcategoria
} from "@/services/subcategoria.services";
import { ActionButton } from "@/components/Buttons/Buttons";

import EditForm from "./EditSubcat";

function Subcategorias({
  subcategoriasData = [],
  categoriasData = [],  // categorías provenientes del padre
  onAdd = null,
  onUpdate = null,
  onDelete = null,
  skipApiCall = false
}) {
  const [subcategorias, setSubcategorias] = useState(subcategoriasData);
  const [activeAdd, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const { deleteSubcategoria } = useDeleteSubcategoria();
  const { deactivateSubcategoria } = useDeactivateSubcategoria();
  const { hasCreatePermission } = usePermisos();
  const [searchTerm, setSearchTerm] = useState("");

  // Si cambian datos externos, sincronizar una sola vez
  useEffect(() => {
    setSubcategorias(subcategoriasData);
  }, [subcategoriasData]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");

  // Utilidad para obtener nombre de categoría
  const getCategoriaNombre = (id_categoria) => {
    const cat = categoriasData.find(c => parseInt(c.id_categoria) === parseInt(id_categoria));
    return cat ? cat.nom_categoria : "";
  };

  // Agregar subcategoría (API + local + callback padre)
  const handleAddSubcategoria = async (newSubcat) => {
    const [ok, id] = await addSubcategoria(newSubcat);
    if (ok) {
      const created = {
        ...newSubcat,
        id_subcategoria: id,
        nom_categoria: getCategoriaNombre(newSubcat.id_categoria),
        estado_subcat: 1
      };
      setSubcategorias(prev => [created, ...prev]);
      onAdd && onAdd(created);
      setModalOpen(false);
    }
  };

  // Editar subcategoría
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
      onUpdate && onUpdate(updatedData.id_subcategoria, updatedData);
      setEditModal({ open: false, data: null });
    }
  };

  // Eliminar
  const handleDeleteSubcategoria = async (id) => {
    const ok = await deleteSubcategoria(id);
    if (ok) {
      setSubcategorias(prev => prev.filter(subcat => subcat.id_subcategoria !== id));
      onDelete && onDelete(id);
    }
  };

  // Desactivar
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
      onUpdate && onUpdate(id, { estado_subcat: 0 });
    }
  };

  // Filtro visual
  const filteredSubcategorias = subcategorias.filter((subcat) =>
    subcat.nom_subcat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>


      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <BarraSearch
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar subcategoría..."
          isClearable={true}
          onClear={handleClearSearch}
          className="h-10 text-sm w-full md:w-72 dark:bg-gray-800 dark:text-white"
        />
        <ActionButton
          color="primary"
          endContent={<FaPlus size={18} />}
          onClick={() => setModalOpen(true)}
          disabled={!hasCreatePermission}
          className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none 
          bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors 
          dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 
          ${!hasCreatePermission ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Agregar subcategoría
        </ActionButton>
      </div>

      <ShowSubcategorias
        searchTerm={searchTerm}
        subcategorias={filteredSubcategorias}
        onEdit={(data) => setEditModal({ open: true, data })}
        onDelete={handleDeleteSubcategoria}
        onDeactivate={handleDeactivateSubcategoria}
      />

      {activeAdd && (
        <SubcategoriaForm
          modalTitle={"Nueva subcategoría"}
          closeModal={() => setModalOpen(false)}
          onSuccess={handleAddSubcategoria}
          categorias={categoriasData}
        />
      )}

      {editModal.open && editModal.data && (
        <EditForm
          isOpen={editModal.open}
          onClose={() => setEditModal({ open: false, data: null })}
          initialData={editModal.data}
          modalTitle={"Editar subcategoría"}
          onSuccess={handleEditSubcategoria}
          categorias={categoriasData}
        />
      )}
    </div>
  );
}

export default Subcategorias;
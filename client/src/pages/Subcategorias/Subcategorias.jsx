import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
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

function Subcategorias() {
  const { subcategorias: subcategoriasApi, loading, error } = getSubcategoriasConCategoria();
  const [subcategorias, setSubcategorias] = useState([]);
  const { categorias, loadCategorias } = useCategorias();
  const [activeAdd, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, data: null });
  // Instancia los hooks correctamente
  const { deleteSubcategoria } = useDeleteSubcategoria();
  const { deactivateSubcategoria } = useDeactivateSubcategoria();
  const { hasCreatePermission } = usePermisos();

  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");

    // Inicializa solo una vez cuando la API termina de cargar
    useEffect(() => {
      if (!loading && subcategorias.length === 0 && Array.isArray(subcategoriasApi)) {
        setSubcategorias(subcategoriasApi);
      }
      // eslint-disable-next-line
    }, [loading, subcategoriasApi]);

      useEffect(() => {
    loadCategorias();
  }, []);

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
    <div>
      <Toaster />
      <h1 className="font-extrabold text-4xl">Gestión de subcategorias</h1>
      <div className="flex justify-between mt-5 mb-4 items-center">
        <div id="barcode-scanner" hidden style={{ width: "100%", height: "400px" }}></div>
        <h6 className="font-bold">Lista de subcategorias</h6>
        <div className="flex items-center gap-4 ml-auto">
          <div className="relative flex-grow max-w-md">
            <BarraSearch
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Ingrese la subcategoria a buscar"
              isClearable={true}
              onClear={handleClearSearch}
            />
          </div>
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={() => setModalOpen(true)}
            disabled={!hasCreatePermission}
            className={`${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Agregar subcategoria
          </Button>
        </div>
      </div>
      <div>
<ShowSubcategorias
  searchTerm={searchTerm}
  subcategorias={subcategorias}
  onEdit={(data) => setEditModal({ open: true, data })}
  onDelete={handleDeleteSubcategoria}
  onDeactivate={handleDeactivateSubcategoria}
/>
      </div>
    {activeAdd && (
      <SubcategoriaForm
        modalTitle={"Nueva subcategoria"}
        closeModal={() => setModalOpen(false)}
        onSuccess={handleAddSubcategoria}
        categorias={categorias}
      />
    )}
{editModal.open && (
  <EditForm
    isOpen={editModal.open}
    modalTitle="Editar Subcategoria"
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
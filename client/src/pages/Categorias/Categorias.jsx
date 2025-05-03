import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import CategoriasForm from "./CategoriasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowCategorias } from "./ShowCategorias";
import { usePermisos } from '@/routes';
import { Button } from "@heroui/button";

function Categorias() {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const { hasCreatePermission } = usePermisos();

  const handleClearSearch = () => {
    setSearchTerm(""); 
  };
  
  return (
    <div>
      <Toaster />
      <Breadcrumb
        paths={[
          { name: "Inicio", href: "/inicio" },
          { name: "Productos", href: "/productos" },
          { name: "Categorias", href: "/productos/categorias" },
        ]}
      />
      <hr className="mb-4" />
      <h1 className="font-extrabold text-4xl">Gestión de categorias</h1>
      <div className="flex justify-between mt-5 mb-4 items-center">
        <div
          id="barcode-scanner"
          hidden
          style={{ width: "100%", height: "400px" }}
        ></div>
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
        <ShowCategorias searchTerm={searchTerm} />
      </div>
      {/* Modal de Agregar Producto */}
      {activeAdd && (
        <CategoriasForm
          modalTitle={"Nueva categoria"}
          onClose={handleModalAdd}
        />
      )}
    </div>
  );
}

export default Categorias;

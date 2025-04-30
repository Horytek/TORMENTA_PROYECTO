import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import SubcategoriaForm from "./SubcategoriaForm";
import ShowSubcategorias from "./ShowSubcategoria";
import { usePermisos } from '@/routes';
import { Button } from "@nextui-org/button";

function Subcategorias() {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  const { hasCreatePermission } = usePermisos();

  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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
          { name: "Subcategorias", href: "/productos/subcategorias" },
        ]}
      />
      <hr className="mb-4" />
      <h1 className="font-extrabold text-4xl">Gestión de subcategorias</h1>
      <div className="flex justify-between mt-5 mb-4 items-center">
        <div
          id="barcode-scanner"
          hidden
          style={{ width: "100%", height: "400px" }}
        ></div>
        <h6 className="font-bold">Lista de subcategorias</h6>
        <div className="flex items-center gap-4 ml-auto">
          <div className="relative flex-grow max-w-md">
            {" "}
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
            onClick={handleModalAdd}
            disabled={!hasCreatePermission}
            className={`${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Agregar subcategoria
          </Button>
        </div>
      </div>
      <div>
        <ShowSubcategorias searchTerm={searchTerm} />
      </div>
      {activeAdd && (
        <SubcategoriaForm
          modalTitle={"Nueva subcategoria"}
          closeModal={handleModalAdd}
        />
      )}
    </div>
  );
}

export default Subcategorias;

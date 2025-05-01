import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import MarcasForm from "./MarcasForm";
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowMarcas } from "./ShowMarcas";
import { usePermisos } from '@/routes';
import { Button } from "@nextui-org/button";


function Marcas() {
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
          { name: "Marcas", href: "/productos/marcas" },
        ]}
      />
      <hr className="mb-4" />
      <h1 className="font-extrabold text-4xl">Gestión de marcas</h1>
      <div className="flex justify-between mt-5 mb-4 items-center">
        <div
          id="barcode-scanner"
          hidden
          style={{ width: "100%", height: "400px" }}
        ></div>
        <h6 className="font-bold">Lista de Marcas</h6>
        <div className="flex items-center gap-4 ml-auto">
          <div className="relative">
            <BarraSearch
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Ingrese la marca a buscar"
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
            Agregar marca
          </Button>

        </div>
      </div>
      <div>
        <ShowMarcas searchTerm={searchTerm} />
      </div>
      <MarcasForm 
        modalTitle={'Nueva marca'} 
        isVisible={activeAdd}
        onClose={handleModalAdd}
      />
    </div>
  );
}

export default Marcas;

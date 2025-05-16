import { useState } from 'react';
import { ShowAlmacenes } from '@/pages/AlmacenG/ShowAlmacenes';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import AlmacenesForm from './AlmacenesForm';
import { Button } from "@heroui/button";
import { usePermisos } from '@/routes';
import { Tooltip } from "@heroui/react";
import BarraSearch from "@/components/Search/Search";

function Almacenes() {
  
  // Estado de Modal de Agregar Almacén
  const [activeAdd, setModalOpen] = useState(false);
  
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  // Input de búsqueda de almacenes
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const { hasCreatePermission } = usePermisos();

  return (
    <div>
      <Toaster />
      {/* <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacenes', href: '/almacenG' }]} /> */}
      <hr className="mb-4" />
      <h1 className='text-4xl font-extrabold'>Gestión de almacenes</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className="font-bold">Lista de Almacenes</h6>
        <BarraSearch
          placeholder="Ingrese un almacén"
          isClearable={true}
          className="h-9 text-sm w-2/4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Tooltip content={hasCreatePermission ? "Agregar almacén" : "No tiene permisos para agregar almacenes"}>
            <Button
              color={hasCreatePermission ? "primary" : "default"}
              endContent={<FaPlus style={{ fontSize: '25px' }} />}
              onClick={() => hasCreatePermission ? handleModalAdd() : null}
              className={hasCreatePermission ? "" : "opacity-50 cursor-not-allowed"}
            >
              Agregar almacén
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <div>
        <ShowAlmacenes searchTerm={searchTerm} />
      </div>

      {/* Renderizar el formulario si activeAdd es true */}
      {activeAdd && (
        <AlmacenesForm 
          modalTitle="Agregar Almacén"
          onClose={handleModalAdd}
          initialData={null} // Indica que es un nuevo almacén
        />
      )}
    </div>
  );
}

export default Almacenes;

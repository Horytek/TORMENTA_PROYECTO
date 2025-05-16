import { useState } from 'react';
import VendedoresForm from './VendedoresForm';
import { Toaster } from "react-hot-toast";
import { ButtonIcon } from '@/components/Buttons/Buttons';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { ShowVendedores } from '@/pages/Empleados/ShowVendedores';
import { Button } from "@heroui/button";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";


function Vendedores() {
  // Estado de Modal de Agregar Vendedor
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  const { hasCreatePermission } = usePermisos();


  // Input de búsqueda de vendedores
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <Toaster />

      <h1 className='text-4xl font-extrabold'>Gestión de empleados</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <h6 className="font-bold">Lista de Empleados</h6>
        <BarraSearch
          placeholder="Ingrese un empleado"
          isClearable={true}
          className="h-9 text-sm w-2/4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={handleModalAdd}
            disabled={!hasCreatePermission}
            className={!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Agregar empleado
          </Button>
        </div>
      </div>
      <div>
        <ShowVendedores searchTerm={searchTerm} />
      </div>

      {/* Modal de Agregar Vendedor */}
      {activeAdd && (
        <VendedoresForm modalTitle={'Nuevo Vendedor'} onClose={handleModalAdd} />
      )}
    </div>
  );
}

export default Vendedores;
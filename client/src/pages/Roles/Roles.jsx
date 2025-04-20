import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowUsuarios } from '@/pages/Roles/ShowUsuarios';
import {Button} from "@nextui-org/button";
import { usePermisos } from '@/routes';
import { Tooltip } from "@nextui-org/tooltip";
import BarraSearch from "@/components/Search/Search";

function Usuarios() {
  
  // Estado de Modal de Agregar Usuario
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  // Input de búsqueda de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const { hasCreatePermission } = usePermisos();

  return (
    <div>
      <Toaster />
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Roles', href: '/configuracion/roles' }]} />
      <hr className="mb-4" />
      <h1 className='text-4xl font-extrabold'>Roles y permisos</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className="font-bold">Lista de Roles</h6>
        <BarraSearch
          placeholder="Ingrese un rol"
          isClearable={true}
          className="h-9 text-sm w-2/4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Tooltip content={hasCreatePermission ? "Agregar rol" : "No tiene permisos para agregar roles"}>
            <Button
              color={hasCreatePermission ? "primary" : "default"}
              endContent={<FaPlus style={{ fontSize: '25px' }} />}
              onClick={() => hasCreatePermission ? handleModalAdd() : null}
              className={hasCreatePermission ? "" : "opacity-50 cursor-not-allowed"}
            >
              Agregar rol
            </Button>
          </Tooltip>
        </div>
      </div>
      <div>
        <ShowUsuarios searchTerm={searchTerm} />
      </div>

      {/* Modal de Agregar Usuario */}
      {activeAdd && (
        <UsuariosForm modalTitle={'Nuevo Rol'} onClose={handleModalAdd} />
      )}
      
    </div>
  );
}

export default Usuarios;
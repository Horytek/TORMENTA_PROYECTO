import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowUsuarios } from '@/pages/Usuarios/ShowUsuarios';
import {Button} from "@heroui/button";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";

function Usuarios() {
  
  // Estado de Modal de Agregar Usuario
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };
  const { hasCreatePermission } = usePermisos();

  // Input de búsqueda de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <Toaster />
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Usuarios', href: '/configuracion/usuarios' }]} />
      <hr className="mb-4" />
      <h1 className='text-4xl font-extrabold'>Usuarios</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className="font-bold">Lista de Usuarios</h6>
        <BarraSearch
          placeholder="Ingrese un usuario"
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
            Agregar usuario
          </Button>
        </div>
      </div>
      <div>
        <ShowUsuarios searchTerm={searchTerm} />
      </div>

      {/* Modal de Agregar Usuario */}
      {activeAdd && (
        <UsuariosForm modalTitle={'Nuevo Usuario'} onClose={handleModalAdd} />
      )}
      
    </div>
  );
}

export default Usuarios;
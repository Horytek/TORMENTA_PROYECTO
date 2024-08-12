import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import { ButtonIcon } from '@/components/Buttons/Buttons';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { ShowUsuarios } from '@/pages/Usuarios/ShowUsuarios';

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

  return (
    <div>
      <Toaster />
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Usuarios', href: '/configuracion/usuarios' }]} />
      <hr className="mb-4" />
      <h1 className='text-4xl font-extrabold'>Usuarios</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className='font-bold'>Lista de Usuarios</h6>
        <div className='relative w-2/4'>
          <div className='absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none'>
            <IoIosSearch className='w-4 h-4 text-gray-500' />
          </div>
          <input 
            type="text" 
            placeholder='Ingrese un usuario' 
            className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5' 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-5">
          <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '25px' }} />} onClick={handleModalAdd}>
            Agregar usuario
          </ButtonIcon>
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
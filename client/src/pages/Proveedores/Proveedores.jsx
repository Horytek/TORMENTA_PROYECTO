import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import DestinatariosForm from './DestinatariosForm';
import { Toaster } from "react-hot-toast";
import { Button } from "@nextui-org/button";
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { ShowDestinatarios } from '@/pages/Proveedores/ShowDestinatarios';
import { usePermisos } from '@/routes';


function Proveedores() {
    // Estado de Modal de Agregar Proveedor
    const [activeAdd, setModalOpen] = useState(false);
    const handleModalAdd = () => {
      setModalOpen(!activeAdd);
    };
    
    const { hasCreatePermission } = usePermisos();


    // Input de búsqueda de proveedores
    const [searchTerm, setSearchTerm] = useState('');
    const handleSearchChange = (e) => {
      const value = e.target.value;
      if (/^[A-Za-z\s]*$/.test(value)) {
        setSearchTerm(value);
      }
    };
  
    return (
      <div>
        <Toaster />
        <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Proveedores', href: '/proveedores' }]} />
        <hr className="mb-4" />
        <h1 className='text-4xl font-extrabold'>Proveedores</h1>
        <div className="flex items-center justify-between mt-5 mb-4">
          <h6 className='font-bold'>Lista de Proveedores</h6>
          <div className='relative w-2/4'>
            <div className='absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none'>
              <IoIosSearch className='w-4 h-4 text-gray-500' />
            </div>
            <input 
              type="text" 
              placeholder='Ingrese el nombre del proveedor' 
              className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5' 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-5">
            <Button color="primary" endContent={<FaPlus style={{ fontSize: '25px' }} />} onClick={handleModalAdd}
            disabled={!hasCreatePermission}
            className={!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Agregar proveedor
            </Button>
          </div>
        </div>
        <div>
        <ShowDestinatarios searchTerm={searchTerm} />
      </div>
  
        {/* Modal de Agregar Proveedor */}
        {activeAdd && (
          <DestinatariosForm modalTitle={'Nuevo Proveedor'} onClose={handleModalAdd} />
        )}
      </div>
    );
  }
  
  export default Proveedores;
  
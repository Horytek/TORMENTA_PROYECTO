import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import DestinatariosForm from './DestinatariosForm';
import { Toaster } from "react-hot-toast";
import { Button } from "@nextui-org/button";
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { ShowDestinatarios } from '@/pages/Proveedores/ShowDestinatarios';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";


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
          <h6 className="font-bold">Lista de Proveedores</h6>
          <BarraSearch
            placeholder="Ingrese el nombre del proveedor"
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

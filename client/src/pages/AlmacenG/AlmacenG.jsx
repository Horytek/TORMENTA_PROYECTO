import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { ShowAlmacenes } from '@/pages/AlmacenG/ShowAlmacenes';
import { Toaster } from "react-hot-toast";
import { ButtonIcon } from '@/components/Buttons/Buttons';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import AlmacenesForm from './AlmacenesForm';
import { Button, ButtonGroup } from "@nextui-org/button";

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

  return (
    <div>
      <Toaster />
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacenes', href: '/almacenG' }]} />
      <hr className="mb-4" />
      <h1 className='text-4xl font-extrabold'>Almacenes</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className='font-bold'>Lista de Almacenes</h6>
        <div className='relative w-2/4'>
          <div className='absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none'>
            <IoIosSearch className='w-4 h-4 text-gray-500' />
          </div>
          <input 
            type="text" 
            placeholder='Ingrese un almacén' 
            className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5' 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-5">
          <Button color="primary" endContent={<FaPlus style={{ fontSize: '25px' }} />} onClick={handleModalAdd}>
            Agregar almacén
          </Button>
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

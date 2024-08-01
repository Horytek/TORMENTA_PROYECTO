import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Pagination from '@/components/Pagination/Pagination';
import ProductosForm from './ProductosForm';
import { Toaster } from "react-hot-toast";
import {ShowProductos} from './ShowProductos';
import { ButtonIcon } from '@/components/Buttons/Buttons';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
 
function Productos() {
  
  // Logica de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  // Modal de Agregar Producto
  const [isModalOpen, setModalOpen] = useState(false);
  
  // Funcion para manejar la accion de iniciar el modal de agregar producto
  const openModal = () => {
    setModalOpen(true);
  };

  // Funcion para manejar la accion de cerrar el modal de agregar producto
  const closeModal = () => {
    setModalOpen(false);
  }; 

  return (
    <div>
      <Toaster/>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Productos', href: '/productos' }]} />
      <hr className="mb-4" />
      <h1 className='font-extrabold text-4xl'>Productos</h1>
      <div className="flex justify-between mt-5 mb-4 items-center">
        <h6 className='font-bold'>Lista de Productos</h6>
        <div className='relative w-2/4'>
          <div className='absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none'>
            <IoIosSearch className='w-4 h-4 text-gray-500' />
          </div>
          <input type="text" placeholder='Ingrese un producto' className='search-product border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5' />
        </div>
        <div className="flex gap-5">
          <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '25px' }}/>} onClick={() => openModal()}>
            Agregar producto
          </ButtonIcon>
        </div>
      </div>
      <div>
        {/* Contenido Tabla */}
        <ShowProductos />
      </div>
      <div className="flex justify-end mt-4">
        <div className="flex">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      </div>

      {/* Modal de Editar Producto */}
      {isModalOpen && (
          <ProductosForm modalTitle={'Nuevo Producto'} onClose={closeModal} />
      )}

    </div>
  );
}

export default Productos;

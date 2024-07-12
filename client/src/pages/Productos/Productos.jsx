import { useState } from 'react';
import './Productos.css';
import productosData from './data/productosData';
import Table from '@/components/Table/Table';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Pagination from '@/components/Pagination/Pagination';
import { ButtonNormal, ButtonIcon } from '@/components/Buttons/Buttons';
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { IoIosSearch } from "react-icons/io";
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import ProductosForm from './ProductosForm';

function Productos() {
  // Definir las columnas de la tabla con el header y key correspondientes
  const columns = [
    { header: 'Descripción', key: 'descripcion' },
    { header: 'Línea', key: 'linea' },
    { header: 'Sub-Línea', key: 'subLinea' },
    { header: 'Und. Med.', key: 'unidadMedida' },
    { header: 'Precio', key: 'precio' },
    { header: 'Cód. Barras', key: 'codBarras' },
    { header: 'Estado', key: 'estado' }
  ];

  // Función para renderizar las acciones de la tabla
  const renderActions = (row) => (
    <div className="flex justify-center items-center">
      <button className="px-2 py-1 text-yellow-400 text-xl" onClick={() => openModal('Editar Producto')}>
        <MdEdit />
      </button>
      <button className="px-2 py-1 text-red-500" onClick={() => handleOpenConfirmationModal(row)}>
        <FaTrash />
      </button>
    </div>
  );

  // Estado para controlar el modal de confirmación
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  // Función para manejar la acción de abrir el modal de confirmación
  const handleOpenConfirmationModal = (row) => {
    setSelectedRow(row);
    setIsConfirmationModalOpen(true);
  };

  // Función para manejar la acción de cerrar el modal de confirmación
  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedRow(null);
  };

  // Función para manejar la acción de confirmar eliminar
  const handleConfirmDelete = () => {
    console.log('Delete', selectedRow);
    // Aquí iría la lógica para eliminar el producto
    handleCloseConfirmationModal();
  };

  // Funcion para manejar la accion de iniciar el modal de agregar/editar producto
  const openModal = (title) => {
    setModalTitle(title);
    setIsModalOpen(true);
  };

  // Funcion para manejar la accion de cerrar el modal de agregar/editar producto
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Logica de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
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
          <ButtonNormal color={'#01BDD6'}>
            Filtrar
          </ButtonNormal>
          <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '25px' }}/>} onClick={() => openModal('Agregar Producto')}>
            Agregar producto
          </ButtonIcon>
        </div>
      </div>
      <div>
        {/* Contenido Tabla */}
        <Table columns={columns} data={productosData} renderActions={renderActions} />
      </div>
      <div className="flex justify-end mt-4">
        <div className="flex">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      </div>

      {/* Modal de Confirmación */}
      {isConfirmationModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar "${selectedRow.descripcion}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Modal de Agregar Producto */}
      {isModalOpen && (
        <ProductosForm modalTitle={modalTitle} onClose={closeModal} />
      )}

    </div>
  );
}

export default Productos;

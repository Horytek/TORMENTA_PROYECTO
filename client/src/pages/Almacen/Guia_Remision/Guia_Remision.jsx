import { useState } from 'react';
import './Guia_Remision.css';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { MdAddCircleOutline } from 'react-icons/md';
import Pagination from '@/components/Pagination/Pagination';
import TablaGuias from './ComponentsGuias/GuiasTable';
import FiltrosGuias from './ComponentsGuias/FiltrosGuias';
import { Link } from 'react-router-dom';
import useGuiasData from '../data/guiasdata';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';

const Guias = () => {
  const { guias, removeGuia } = useGuiasData();

  // Estado para el manejo del modal de confirmación
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5; // Número total de páginas

  // Función para manejar la acción de abrir el modal de confirmación
  const handleOpenConfirmationModal = (rowId) => {
    setSelectedRowId(rowId);
    setIsConfirmationModalOpen(true);
  };

  // Función para manejar la acción de cerrar el modal de confirmación
  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedRowId(null);
  };

  // Función para manejar la acción de confirmar eliminar
  const handleConfirmDelete = () => {
    removeGuia(selectedRowId);
    handleCloseConfirmationModal();
  };

  // Función para cambiar de página en la paginación
  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacen', href: '/almacen' }, { name: 'Guias de Remision', href: '/almacen/guia_remision' }]} />

      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Guias de Remision
        </h1>
        <Link to="/almacen/guia_remision/registro_guia" className="btn btn-nueva-guia mr-0">
          <MdAddCircleOutline className="inline-block mr-2" style={{ fontSize: '25px' }} />
          Nueva guia
        </Link>
      </div>

      <FiltrosGuias />

      <TablaGuias
        guias={guias}
        handleOpenConfirmationModal={handleOpenConfirmationModal}
      />

      <div className="flex justify-between mt-4">
        <div className="flex">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
        <select className="input cant-pag">
          <option>5</option>
          <option>10</option>
          <option>20</option>
        </select>
      </div>

      {isConfirmationModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar esta guía?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default Guias;

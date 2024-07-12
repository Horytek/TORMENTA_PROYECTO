import { useState } from 'react';
import './Guia_Remision.css';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { MdAddCircleOutline, MdEdit } from 'react-icons/md';

import Pagination from '@/components/Pagination/Pagination';
import TablaGuias from './ComponentsGuias/GuiasTable';
import FiltrosGuias from './ComponentsGuias/FiltrosGuias';
import OptionsModal from './ComponentsGuias/Modals/OptionsModal';
import ConfirmationModal from './ComponentsGuias/Modals/ConfirmationModal';
import { Link } from 'react-router-dom';
import useGuiasData from '../data/guiasdata';

const Guias = () => {
  /* const renderActions = (row) => (
    <div className="flex justify-center items-center">
      <button className="px-2 py-1 text-yellow-400 text-xl" onClick={() => openModal('Editar Producto')}>
        <MdEdit />
      </button>
      <button className="px-2 py-1 text-red-500" onClick={() => handleOpenConfirmationModal(row)}>
        <FaTrash />
      </button>
    </div>
  ); */
  // Estado para manejar la lista de guias
  const { guias, removeGuia  } = useGuiasData();

  // Estado para el manejo del modal y opciones de eliminación
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5; // Número total de páginas

  // Funciones para abrir y cerrar el modal de opciones
  const openModal = (id) => {
    setSelectedRowId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRowId(null);
    setModalOpen(false);
    setDeleteOptionSelected(false);
  };

  // Función para alternar la opción de eliminar guia
  const toggleDeleteDetalleOption = () => {
    setDeleteOptionSelected(!deleteOptionSelected);
  };

  // Función para eliminar una guia
  const handleDeleteGuia = () => {
    removeGuia(selectedRowId);
    closeModal();
    setConfirmDeleteModalOpen(false);
  };

  // Función para cambiar de página en la paginación
  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {/* Componente de migas de pan */}
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacen', href: '/almacen' }, { name: 'Guias de Remision', href: '/guiasremision' }]} />

      <hr className="mb-4" />
      {/* Encabezado principal */}
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Guias de Remision
        </h1>             
        <Link to="/almacen/guia_remision/registro_guia" className="btn btn-nueva-guia mr-0">
          <MdAddCircleOutline className="inline-block mr-2" style={{ fontSize: '25px' }} />
          Nueva guia
        </Link>
        
      </div>

      {/* Componente de filtros */}
      <FiltrosGuias />

      {/* Componente de tabla de guias */}
      <TablaGuias
        guias={guias}
        modalOpen={modalOpen}
        deleteOptionSelected={deleteOptionSelected}
        openModal={openModal}
        /* currentPage={currentPage} */
      />

      {/* Modal para opciones */}
      <OptionsModal
        modalOpen={modalOpen}
        toggleDeleteDetalleOption={toggleDeleteDetalleOption}
        closeModal={closeModal}
        setConfirmDeleteModalOpen={setConfirmDeleteModalOpen}
        deleteOptionSelected={deleteOptionSelected}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        confirmDeleteModalOpen={confirmDeleteModalOpen}
        handleDeleteGuia={handleDeleteGuia}
        closeModal={closeModal}
        setConfirmDeleteModalOpen={setConfirmDeleteModalOpen}
      />

      {/* Contenedor para paginación */}
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
    </div>
  );
};

export default Guias;

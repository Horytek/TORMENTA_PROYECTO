import { useState,useEffect,useCallback} from 'react';
import './Ventas.css';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { MdAddCircleOutline } from 'react-icons/md';
import Pagination from '@/components/Pagination/Pagination';
import TablaVentas from './ComponentsVentas/VentasTable';
import FiltrosVentas from './ComponentsVentas/FiltrosVentas';
import OptionsModal from './ComponentsVentas/Modals/OptionsModal';
import ConfirmationModal from './ComponentsVentas/Modals/ConfirmationModal';
import { Link } from 'react-router-dom';
import useVentasData from '../Data/data_venta';
import { Toaster} from "react-hot-toast";
import { handleDelete } from '../Data/delete_venta';

const Ventas = () => {
  // Estado para manejar la lista de ventas
  const [filters, setFilters] = useState({
    comprobanteSeleccionado: '',
    sucursalSeleccionado: '',
    fecha_i: '',
    fecha_e: '',
    razon: ''
  });


  const { ventas, currentPage, setCurrentPage, totalPages, ventasPerPage, setVentasPerPage, totalRecaudado, refetchVentas } = useVentasData(filters);

  // Estado para el manejo del modal y opciones de eliminación
  const [SelectedRowId,setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const loadDetallesFromLocalStorage = () => {
    const savedDetalles = localStorage.getItem('ventas');
    return savedDetalles ? JSON.parse(savedDetalles) : [];
  };

  const d_ventas = loadDetallesFromLocalStorage();


  const saveDetallesToLocalStorage = () => {
    localStorage.setItem('total_ventas', JSON.stringify(ventas));
  };

  saveDetallesToLocalStorage();
  // Funciones para abrir y cerrar el modal de opciones
  const openModal = (id,estado) => {
    setSelectedRowId(id);
    setModalOpen(true);

    if (estado=='En proceso') {
      estado= 2;
    } else if (estado=='Inactivo') {
      estado= 1;
    } else if (estado=='Activo') {
      estado= 0;
    }

    if(estado==1){
      setModalOpen(false);
    }
  };

  const closeModal = () => {
    setSelectedRowId(null);
    setModalOpen(false);
    setDeleteOptionSelected(false);
  };

  // Función para alternar la opción de eliminar venta
  const toggleDeleteDetalleOption = () => {
    setDeleteOptionSelected(!deleteOptionSelected);
  };

  // Función para eliminar una venta
  const handleDeleteVenta = () => {
    SelectedRowId;
    handleDelete(d_ventas);
    closeModal();
    setConfirmDeleteModalOpen(false);
    setIsDeleted(true); // Activa el efecto para actualizar las ventas
  };

  useEffect(() => {
    if (isDeleted) {
      refetchVentas();
      setIsDeleted(false);
    }
  }, [isDeleted, refetchVentas]);

  // Función para cambiar de página en la paginación
  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Resetear la página actual al cambiar filtros
  }, [setCurrentPage]);

  return (
    <div>
      <Toaster />
      {/* Componente de migas de pan */}
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Ventas', href: '/ventas' }]} />

      <hr className="mb-4" />
      {/* Encabezado principal */}
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Ventas  S/. {totalRecaudado}
        </h1>
        <Link to="/ventas/registro_venta" className="btn btn-nueva-venta mr-0">
          <MdAddCircleOutline className="inline-block mr-2" style={{ fontSize: '25px' }} />
          Nueva venta
        </Link>
      </div>

      {/* Componente de filtros */}
      <FiltrosVentas onFiltersChange={handleFilterChange} />

      {/* Componente de tabla de ventas */}
      <TablaVentas
        ventas={ventas}
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
        handleDeleteVenta={handleDeleteVenta}
        closeModal={closeModal}
        setConfirmDeleteModalOpen={setConfirmDeleteModalOpen}
      />

      {/* Contenedor para paginación */}
      <div className="flex justify-between mt-4">
      <div className="flex">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
        <select className="input-c cant-pag-c" value={ventasPerPage} onChange={(e) => setVentasPerPage(Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
    </div>
  );
};

export default Ventas;
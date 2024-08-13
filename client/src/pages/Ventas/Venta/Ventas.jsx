import { useState, useEffect, useCallback } from 'react';
import './Ventas.css';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Pagination from '@/components/Pagination/Pagination';
import TablaVentas from './ComponentsVentas/VentasTable';
import FiltrosVentas from './ComponentsVentas/FiltrosVentas';
import OptionsModal from './ComponentsVentas/Modals/OptionsModal';
import ConfirmationModal from './ComponentsVentas/Modals/ConfirmationModal';
import useVentasData from '../Data/data_venta';
import { Toaster } from "react-hot-toast";
import { handleDelete } from '../Data/delete_venta';
import { anularVentaEnSunatF,anularVentaEnSunatB } from '../Data/anular_sunat';
const Ventas = () => {
  // Estado para manejar la lista de ventas
  const [filters, setFilters] = useState({
    comprobanteSeleccionado: '',
    sucursalSeleccionado: '',
    fecha_i: '',
    fecha_e: '',
    razon: ''
  });


  const { ventas, currentPage, setCurrentPage, totalPages, ventasPerPage, setVentasPerPage, totalRecaudado, refetchVentas,totalEfectivo,totalPagoElectronico } = useVentasData(filters);

  // Estado para el manejo del modal y opciones de eliminación
  const [SelectedRowId, setSelectedRowId] = useState(null);
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

  const loadDetallesFromLocalStorage1 = () => {
    const savedDetalles = localStorage.getItem('new_detalle');
    return savedDetalles ? JSON.parse(savedDetalles) : [];
  };

  const detalles = loadDetallesFromLocalStorage1();

  saveDetallesToLocalStorage();
  // Funciones para abrir y cerrar el modal de opciones
  const openModal = (id, estado) => {
    setSelectedRowId(id);
    setModalOpen(true);

    if (estado == 'En proceso') {
      estado = 2;
    } else if (estado == 'Anulada') {
      estado = 0;
    } else if (estado == 'Aceptada') {
      estado = 1;
    }

    if (estado == 0) {
      setModalOpen(false);
    }
  };

  const closeModal = () => {
    setSelectedRowId(null);
    setModalOpen(false);
    setDeleteOptionSelected(false);
  };

  // Función para eliminar una venta
  const handleDeleteVenta = () => {
    SelectedRowId;
    handleDelete(d_ventas);
    if(d_ventas.tipoComprobante ==='Boleta' && d_ventas.estado_sunat===1){
      anularVentaEnSunatB(d_ventas,detalles);
    } else if(d_ventas.tipoComprobante ==='Factura' && d_ventas.estado_sunat===1){
      anularVentaEnSunatF(d_ventas);
    }
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
          Ventas
        </h1>
      </div>

      <div className='w-full mb-3 rounded-lg'>
        <table className='w-full text-sm divide-gray-200 rounded-lg table-auto border-collapse'>
          <tbody className="bg-gray-50">
            <tr className='text-center'>
              <td className='border-r-2 border-t-0'> 
                <strong>Cant. Ventas:</strong> <span>{ventas.length}</span> 
              </td>
              <td className='border-l-2 border-r-2 border-t-0'>
                <strong>Total Efectivo: S/.</strong> <span>{totalEfectivo}</span> 
              </td>
              <td className='border-l-2 border-r-2 border-t-0'>
                <strong>Total Pago Electr: S/.</strong> <span>{totalPagoElectronico}</span> 
              </td>
              <td className='border-l border-t-0'>
                <strong>Total General: S/.</strong> {totalRecaudado}<span></span> 
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Componente de filtros */}
      <FiltrosVentas onFiltersChange={handleFilterChange} refetchVentas={refetchVentas} />

      {/* Componente de tabla de ventas */}
      <TablaVentas
        ventas={ventas}
        modalOpen={modalOpen}
        deleteOptionSelected={deleteOptionSelected}
        openModal={openModal}
        currentPage={currentPage} 
      />

      {/* Modal para opciones */}
      <OptionsModal
        modalOpen={modalOpen}
        closeModal={closeModal}
        setConfirmDeleteModalOpen={setConfirmDeleteModalOpen}
        deleteOptionSelected={deleteOptionSelected}
        refetchVentas={refetchVentas}
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
        <select
          className="pr-8 border-gray-300 rounded-lg input-c cant-pag-c bg-gray-50"
          value={ventasPerPage}
          onChange={(e) => setVentasPerPage(Number(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>

      </div>
    </div>
  );
};

export default Ventas;
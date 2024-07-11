import { useState } from 'react';
import './Ventas.css';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { MdAddCircleOutline } from 'react-icons/md';
import Pagination from '@/components/Pagination/Pagination';
import TablaVentas from '../ComponentsVentas/VentasTable';
import FiltrosVentas from '../ComponentsVentas/FiltrosVentas';
import OptionsModal from '../ComponentsVentas/Modals/OptionsModal';
import ConfirmationModal from '../ComponentsVentas/Modals/ConfirmationModal';
import { Link } from 'react-router-dom';

const Ventas = () => {
  // Estado para manejar la lista de ventas
  const [ventas, setVentas] = useState([
    {
      id: 1,
      serieNum: '001',
      num: '4000045',
      tipoComprobante: 'Factura',
      cliente: 'Empresa VALDOS I.R.L',
      ruc: '10524578961',
      fechaEmision: '2024-01-03',
      igv: 'S/ 26.64',
      total: 'S/ 174.64',
      cajero: 'Julio Jeanpierre Castañeda',
      cajeroId: '78541236',
      estado: 'Activo',
      detalles: [
        { codigo: '001', nombre: 'Pantalon Jean Resgasdo  Talla 32 - Azul', cantidad: 2, precio: 'S/ 50', descuento: 'S/ 5', igv: 'S/ 10', subtotal: 'S/ 95' },
        { codigo: '002', nombre: 'Vestido jean  Talla 28 - Celeste', cantidad: 1, precio: 'S/ 100', descuento: 'S/ 10', igv: 'S/ 18', subtotal: 'S/ 108' },
        { codigo: '003', nombre: 'Vestido jean  Talla 28 - Rojo', cantidad: 3, precio: 'S/ 20', descuento: 'S/ 2', igv: 'S/ 4', subtotal: 'S/ 56' }
      ]
    },
    {
      id: 2,
      serieNum: '001',
      num: '1200367',
      tipoComprobante: 'Boleta',
      cliente: 'Denis Cordova Moran',
      ruc: '14151289',
      fechaEmision: '2024-01-03',
      igv: 'S/ 0.90',
      total: 'S/ 5.90',
      cajero: 'Julio Jeanpierre Castañeda',
      cajeroId: '78541236',
      estado: 'Activo',
      detalles: [
        { codigo: '004', nombre: 'Producto D', cantidad: 1, precio: 'S/ 5', descuento: 'S/ 0', igv: 'S/ 0.9', subtotal: 'S/ 5.9' }
      ]
    },
    {
      id: 3,
      serieNum: '001',
      num: '1000074',
      tipoComprobante: 'Nota',
      cliente: 'N/A',
      ruc: '',
      fechaEmision: '2024-01-03',
      igv: 'S/ 0.00',
      total: 'S/ 26.00',
      cajero: 'Julio Jeanpierre Castañeda',
      cajeroId: '78541236',
      estado: 'Activo',
      detalles: [
        { codigo: '005', nombre: 'Producto E', cantidad: 1, precio: 'S/ 25', descuento: 'S/ 0', igv: 'S/ 4.5', subtotal: 'S/ 29.5' }
      ]
    }
  ]);
  

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

  // Función para alternar la opción de eliminar venta
  const toggleDeleteDetalleOption = () => {
    setDeleteOptionSelected(!deleteOptionSelected);
  };

  // Función para eliminar una venta
  const handleDeleteVenta = () => {
    const updatedVentas = ventas.filter((venta) => venta.id !== selectedRowId);
    setVentas(updatedVentas);
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
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Ventas', href: '/ventas' }]} />

      <hr className="mb-4" />
      {/* Encabezado principal */}
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Ventas  S/. 5842.05
        </h1>
        <Link to="/ventas/registro_venta" className="btn btn-nueva-venta mr-0">
          <MdAddCircleOutline className="inline-block mr-2" style={{ fontSize: '25px' }} />
          Nueva venta
        </Link>
      </div>

      {/* Componente de filtros */}
      <FiltrosVentas />

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
        <select className="input cant-pag">
          <option>5</option>
          <option>10</option>
          <option>20</option>
        </select>
      </div>
    </div>
  );
};

export default Ventas;

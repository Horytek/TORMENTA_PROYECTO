import { useState, useEffect, useCallback } from 'react';
import TablaVentas from './ComponentsVentas/VentasTable';
import FiltrosVentas from './ComponentsVentas/FiltrosVentas';
import OptionsModal from './ComponentsVentas/Modals/OptionsModal';
import ConfirmationModal from './ComponentsVentas/Modals/ConfirmationModal';
import useVentasData from '@/services/Data/data_venta';
import { Toaster } from "react-hot-toast";
import { handleDelete } from '@/services/Data/delete_venta';
import { Pagination } from "@heroui/pagination";
import { Select, SelectItem } from "@heroui/react";
import { anularVentaEnSunatF, anularVentaEnSunatB } from '@/services/Data/anular_sunat';
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";

const Ventas = () => {
  // Estado para manejar la lista de ventas
  const [filters, setFilters] = useState({
    comprobanteSeleccionado: '',
    sucursalSeleccionado: '',
    fecha_i: '',
    fecha_e: '',
    razon: ''
  });

  const {
    ventas,
    currentPage,
    setCurrentPage,
    totalPages,
    ventasPerPage,
    setVentasPerPage,
    totalRecaudado,
    totalEfectivo,
    totalPagoElectronico,
    removeVenta, // <-- Añade esta función del hook
    updateVenta, // <-- Si necesitas actualizar ventas localmente
  } = useVentasData(filters);

  // Zustand: obtener y setear datos globales
  const setTotalVentas = useVentaSeleccionadaStore((state) => state.setTotalVentas);
  const setVentaSeleccionada = useVentaSeleccionadaStore((state) => state.setVentaSeleccionada);
  const ventaSeleccionada = useVentaSeleccionadaStore((state) => state.venta);
  const detallesSeleccionados = useVentaSeleccionadaStore((state) => state.detalles);

  // Estado para el manejo del modal y opciones de eliminación
  const [SelectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);

  // Guarda el total de ventas en Zustand cada vez que cambian
  useEffect(() => {
    setTotalVentas(ventas);
  }, [ventas, setTotalVentas]);

  // Funciones para abrir y cerrar el modal de opciones
  const openModal = (id, estado) => {
    setSelectedRowId(id);
    setModalOpen(true);

    // Busca la venta seleccionada y sus detalles
    const venta = ventas.find(v => v.id === id);
    if (venta) {
      setVentaSeleccionada(venta, venta.detalles);
    }

    let estadoNum = estado;
    if (estado === 'En proceso') estadoNum = 2;
    else if (estado === 'Anulada') estadoNum = 0;
    else if (estado === 'Aceptada') estadoNum = 1;

    if (estadoNum === 0) {
      setModalOpen(false);
    }
  };

  const closeModal = () => {
    setSelectedRowId(null);
    setModalOpen(false);
    setDeleteOptionSelected(false);
  };

  // Función para eliminar una venta (solo actualiza el estado local)
  const handleDeleteVenta = () => {
    if (!ventaSeleccionada) return;
    handleDelete(ventaSeleccionada); // Lógica de backend si aplica
    removeVenta(ventaSeleccionada.id); // Elimina del estado local
    if (ventaSeleccionada?.tipoComprobante === 'Boleta' && ventaSeleccionada?.estado_sunat === 1) {
      anularVentaEnSunatB(ventaSeleccionada, detallesSeleccionados);
    } else if (ventaSeleccionada?.tipoComprobante === 'Factura' && ventaSeleccionada?.estado_sunat === 1) {
      anularVentaEnSunatF(ventaSeleccionada);
    }
    closeModal();
    setConfirmDeleteModalOpen(false);
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Resetear la página actual al cambiar filtros
  }, [setCurrentPage]);

  return (
    <div>
      <Toaster />

      {/* Encabezado principal */}
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold text-[36px]">
          Ventas
        </h1>
      </div>

      <div className='w-full mb-3 rounded-lg'>
        <table className='w-full text-sm divide-gray-200 rounded-lg table-auto border-collapse shadow-[0_0_10px_#171a1f0e] bg-[#171a1f0e]'>
          <tbody className="bg-gray-50">
            <tr className='text-center'>
              <td className='border-r-2 border-t-0 py-2 px-4'>
                <strong>Cant. Ventas:</strong> <span>{ventas.length}</span>
              </td>
              <td className='border-l-2 border-r-2 border-t-0 py-2 px-4'>
                <strong>Total Efectivo: S/.</strong> <span>{totalEfectivo}</span>
              </td>
              <td className='border-l-2 border-r-2 border-t-0 py-2 px-4'>
                <strong>Total Pago Electr: S/.</strong> <span>{totalPagoElectronico}</span>
              </td>
              <td className='border-l border-t-0 py-2 px-4'>
                <strong>Total General: S/.</strong> {totalRecaudado}<span></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Componente de filtros */}
      <FiltrosVentas onFiltersChange={handleFilterChange} />

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
        onDeleteVenta={handleDeleteVenta}
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
          <Pagination showControls color="primary" page={currentPage} total={totalPages} onChange={setCurrentPage} />
        </div>
        <Select
          aria-label="Ventas por página"
          selectedKeys={[String(ventasPerPage)]}
          onSelectionChange={(keys) => setVentasPerPage(Number(Array.from(keys)[0]))}
          className="w-28"
        >
          <SelectItem key="5" value={5}>5</SelectItem>
          <SelectItem key="10" value={10}>10</SelectItem>
          <SelectItem key="20" value={20}>20</SelectItem>
          <SelectItem key="100000" value={100000}>Todos</SelectItem>
        </Select>
      </div>
    </div>
  );
};

export default Ventas;
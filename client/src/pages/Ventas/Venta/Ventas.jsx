import { useState, useEffect, useCallback, useMemo } from 'react';
import TablaVentas from './ComponentsVentas/VentasTable';
import FiltrosVentas from './ComponentsVentas/FiltrosVentas';
import OptionsModal from './ComponentsVentas/Modals/OptionsModal';
import ConfirmationModal from './ComponentsVentas/Modals/ConfirmationModal';
import useVentasData from '@/services/data/data_venta';
import { Toaster } from "react-hot-toast";
import { handleDelete } from '@/services/data/delete_venta';
import { Select, SelectItem, Pagination } from "@heroui/react";
import { useUserStore } from "@/store/useStore";
import { anularVentaEnSunatF, anularVentaEnSunatB } from '@/services/data/anular_sunat';
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import { Card, CardBody, ScrollShadow } from "@heroui/react";
import { FaShoppingBag, FaMoneyBillWave, FaCreditCard, FaCalculator } from "react-icons/fa";
import useSucursalData from '@/services/data/data_sucursal_venta';

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
    removeVenta,
    updateVenta, 
  } = useVentasData(filters);

  // Zustand: obtener y setear datos globales
  const setTotalVentas = useVentaSeleccionadaStore((state) => state.setTotalVentas);
  const setVentaSeleccionada = useVentaSeleccionadaStore((state) => state.setVentaSeleccionada);
  const ventaSeleccionada = useVentaSeleccionadaStore((state) => state.venta);
  const detallesSeleccionados = useVentaSeleccionadaStore((state) => state.detalles);
  const nombre = useUserStore((state) => state.nombre);
  const sur = useUserStore(state => state.sur);

  // Estado para el manejo del modal y opciones de eliminación
  const [SelectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);

  const { sucursales } = useSucursalData();
  const sucursalV = useMemo(() => {
      const found =
        (sucursales || []).find(
          s => String(s.nombre || '').toLowerCase() === String(sur || '').toLowerCase()
        ) || null;
  
      return {
        nombre: found?.nombre || sur || '',
        ubicacion: found?.ubicacion || '',
      };
    }, [sucursales, sur]);
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
      const datos_venta = {
        id,
        serieNum: venta.serieNum,
        num: venta.num,
        tipoComprobante: venta.tipoComprobante,
        estado: venta.estado,
        igv: venta.igv,
        nombre: venta.cliente,
        documento: venta.ruc,
        fechaEmision: venta.fecha_iso,
        id_anular: venta.id_anular,
        id_anular_b: venta.id_anular_b,
        estado_sunat: venta.estado_sunat,
        anular: venta.anular,
        anular_b: venta.anular_b,
        id_venta_boucher: venta.id_venta_boucher,
        sucursal: sucursalV.nombre,
        direccion: sucursalV.ubicacion,
        usua_vendedor: venta.usua_vendedor,
        observacion: venta.observacion || '',
        usua_usuario: nombre,
        hora_creacion: venta.hora_creacion
      };
      setVentaSeleccionada(datos_venta, venta.detalles);
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
    updateVenta(ventaSeleccionada.id, { estado: 'Anulada' });
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
  <div className="min-h-screen py-8 px-2 sm:px-6">
    <Toaster />

    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header principal */}
      <div className="bg-white/80 border border-blue-100 rounded-2xl shadow-sm p-6 mb-4">
        <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">
          Gestión de ventas
        </h1>
        <p className="text-base text-blue-700/80 mb-2">
          Visualiza, filtra y administra todas tus ventas de manera eficiente y centralizada.
        </p>
      </div>

      {/* KPIs */}
      <div className="w-full mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border border-rose-200/40 bg-white/90 rounded-2xl shadow-none">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-rose-100/80 via-white to-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-200/70 to-white rounded-full blur-xl"></div>
          </div>
          <CardBody className="flex flex-col justify-between h-full p-5 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-3 rounded-xl bg-rose-200 shadow">
                <FaShoppingBag className="text-2xl text-rose-500" />
              </span>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-zinc-900">
                S/. {totalRecaudado ? totalRecaudado : "0.00"}
              </span>
              <div className="text-sm text-zinc-600 font-medium">Total Ventas</div>
            </div>
          </CardBody>
        </Card>
        <Card className="relative overflow-hidden border border-violet-200/40 bg-white/90 rounded-2xl shadow-none">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-violet-100/80 via-white to-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-200/70 to-white rounded-full blur-xl"></div>
          </div>
          <CardBody className="flex flex-col justify-between h-full p-5 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-3 rounded-xl bg-violet-200 shadow">
                <FaMoneyBillWave className="text-2xl text-violet-500" />
              </span>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-zinc-900">
                {totalEfectivo ? totalEfectivo : "0.00"}
              </span>
              <div className="text-sm text-zinc-600 font-medium">Total Efectivo</div>
            </div>
          </CardBody>
        </Card>
        <Card className="relative overflow-hidden border border-emerald-200/40 bg-white/90 rounded-2xl shadow-none">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-100/80 via-white to-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-200/70 to-white rounded-full blur-xl"></div>
          </div>
          <CardBody className="flex flex-col justify-between h-full p-5 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-3 rounded-xl bg-emerald-200 shadow">
                <FaCreditCard className="text-2xl text-emerald-500" />
              </span>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-zinc-900">
                {totalPagoElectronico ? totalPagoElectronico : "0.00"}
              </span>
              <div className="text-sm text-zinc-600 font-medium">Total Pago Electrónico</div>
            </div>
          </CardBody>
        </Card>
        <Card className="relative overflow-hidden border border-blue-200/40 bg-white/90 rounded-2xl shadow-none">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/80 via-white to-white rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/70 to-white rounded-full blur-xl"></div>
          </div>
          <CardBody className="flex flex-col justify-between h-full p-5 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="p-3 rounded-xl bg-blue-200 shadow">
                <FaCalculator className="text-2xl text-blue-500" />
              </span>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-zinc-900">
                {ventas && ventas.length ? ventas.length : "0"}
              </span>
              <div className="text-sm text-zinc-600 font-medium">Cantidad de Ventas</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 p-4">
          <FiltrosVentas onFiltersChange={handleFilterChange} />
        </div>
      </div>

      {/* Tabla de ventas con ScrollShadow */}
      <ScrollShadow hideScrollBar className="rounded-xl mt-6 w-full overflow-x-auto overflow-y-hidden">
        <div className="min-w-[900px]">
          <TablaVentas
            ventas={ventas || []}
            modalOpen={modalOpen}
            deleteOptionSelected={deleteOptionSelected}
            openModal={openModal}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            ventasPerPage={ventasPerPage}
            setVentasPerPage={setVentasPerPage}
          />
        </div>
      </ScrollShadow>

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
    </div>
  </div>
);
};

export default Ventas;
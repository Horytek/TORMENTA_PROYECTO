import { useState, useEffect, useCallback, useMemo } from 'react';
import TablaVentas from './ComponentsVentas/VentasTable';
import VentasOnlineTable from './ComponentsVentas/VentasOnlineTable';
import FiltrosVentas from './ComponentsVentas/FiltrosVentas';
import OptionsModal from './ComponentsVentas/Modals/OptionsModal';
import ConfirmationModal from './ComponentsVentas/Modals/ConfirmationModal';
import { useVentasData, useVentasOnlineData } from "@/services/ventas.services";


import { useUserStore } from "@/store/useStore";
import { handleDelete, anularVentaEnSunatF, anularVentaEnSunatB } from "@/services/ventas.services";
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import { Card, CardBody, ScrollShadow } from "@heroui/react";
import { FaShoppingBag, FaMoneyBillWave, FaCreditCard, FaCalculator, FaGlobe, FaStore } from "react-icons/fa";
import { useSucursalData } from "@/services/ventas.services";
import { Tabs, Tab } from "@heroui/react";
import InventoryCalendar from './ComponentsVentas/InventoryCalendar/InventoryCalendar';
import VentasStats from './ComponentsVentas/VentasStats';

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
    updateVenta,
    refreshVentas,
    allVentas
  } = useVentasData(filters);

  // Hook para ventas online (tesis_db)
  const {
    ventas: ventasOnline,
    loading: loadingOnline,
    currentPage: currentPageOnline,
    setCurrentPage: setCurrentPageOnline,
    totalPages: totalPagesOnline,
    ventasPerPage: ventasPerPageOnline,
    setVentasPerPage: setVentasPerPageOnline,
    totalOnline,
    cantidadOnline,
    refreshVentas: refreshVentasOnline
  } = useVentasOnlineData(filters);

  // Zustand: obtener y setear datos globales
  const setTotalVentas = useVentaSeleccionadaStore((state) => state.setTotalVentas);
  const setVentaSeleccionada = useVentaSeleccionadaStore((state) => state.setVentaSeleccionada);
  const ventaSeleccionada = useVentaSeleccionadaStore((state) => state.venta);
  const detallesSeleccionados = useVentaSeleccionadaStore((state) => state.detalles);
  const nombre = useUserStore((state) => state.nombre);
  const user = useUserStore((state) => state.user);
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
        sucursal: sucursalV.nombre,
        direccion: sucursalV.ubicacion,
        usua_vendedor: venta.usua_vendedor,
        observacion: venta.observacion || '',
        usua_usuario: nombre,
        id_usuario: user?.id,
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
    updateVenta(ventaSeleccionada.id, { estado: 'Anulada', u_modifica: nombre });
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

  // Clean White Classes & KPI Component
  const cardClass = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl";

  const KpiCard = ({ title, value, icon: Icon, colorClass }) => (
    <Card className={`${cardClass} border-none shadow-sm`}>
      <CardBody className="flex flex-row items-center gap-4 p-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
          <Icon className={`text-2xl ${colorClass.replace('bg-', 'text-').replace('/10', '')}`} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-6 md:p-8 font-inter">

      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header principal */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1e293b] dark:text-white tracking-tight">
              Gestión de Ventas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
              Visualiza y administra todas tus ventas de manera eficiente.
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs aria-label="Vistas de Ventas" color="primary" variant="underlined">
          <Tab key="ventas" title="Listado de Ventas">
            <div className="space-y-6 mt-4">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="Total Ventas"
                  value={`S/. ${totalRecaudado ? totalRecaudado : "0.00"}`}
                  icon={FaShoppingBag}
                  colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                />
                <KpiCard
                  title="Total Efectivo"
                  value={totalEfectivo ? totalEfectivo : "0.00"}
                  icon={FaMoneyBillWave}
                  colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                />
                <KpiCard
                  title="Total Electrónico"
                  value={totalPagoElectronico ? totalPagoElectronico : "0.00"}
                  icon={FaCreditCard}
                  colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <KpiCard
                  title="Cantidad Ventas"
                  value={ventas && ventas.length ? ventas.length : "0"}
                  icon={FaCalculator}
                  colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
              </div>

              {/* Filtros */}
              <div className="space-y-4">
                <FiltrosVentas onFiltersChange={handleFilterChange} />
              </div>

              {/* Tabla de ventas con ScrollShadow */}
              <ScrollShadow hideScrollBar className="rounded-xl w-full overflow-x-auto overflow-y-hidden">
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
                    refreshVentas={refreshVentas}
                  />
                </div>
              </ScrollShadow>
            </div>
          </Tab>
          <Tab key="online" title={
            <div className="flex items-center gap-2">
              <FaGlobe className="text-emerald-500" />
              <span>Ventas Online</span>
            </div>
          }>
            <div className="space-y-6 mt-4">
              {/* KPIs Online */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard
                  title="Total Ventas Online"
                  value={`S/. ${totalOnline || "0.00"}`}
                  icon={FaGlobe}
                  colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <KpiCard
                  title="Total Electrónico"
                  value={`S/. ${totalOnline || "0.00"}`}
                  icon={FaCreditCard}
                  colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <KpiCard
                  title="Cantidad Ventas"
                  value={cantidadOnline || "0"}
                  icon={FaCalculator}
                  colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                />
              </div>

              {/* Tabla de ventas online */}
              <VentasOnlineTable
                ventas={ventasOnline || []}
                loading={loadingOnline}
                currentPage={currentPageOnline}
                totalPages={totalPagesOnline}
                setCurrentPage={setCurrentPageOnline}
                ventasPerPage={ventasPerPageOnline}
                setVentasPerPage={setVentasPerPageOnline}
              />
            </div>
          </Tab>
          <Tab key="inventario" title="Inventario y Calendario">
            <div className="mt-4">
              <InventoryCalendar ventas={allVentas} />
            </div>
          </Tab>
          <Tab key="estadisticas" title="Estadísticas">
            <VentasStats />
          </Tab>
        </Tabs>

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
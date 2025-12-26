import { useState, useEffect, useMemo } from 'react';
import { Toaster } from "react-hot-toast";
import { Button, Card, CardBody, Chip, Input, Pagination, Select, SelectItem } from '@heroui/react';
import { FaPlus, FaWarehouse, FaCheckCircle, FaTimesCircle, FaFileExcel, FaFileExport, FaSearch } from "react-icons/fa";
import { usePermisos } from '@/routes';
import { getAlmacenes_A } from '@/services/almacen.services';
import TablaAlmacen from './Components/TablaAlmacen';
import AlmacenesForm from './AlmacenesForm';
import { exportAlmacenesLocal, filterAlmacenesForExport } from '@/utils/exportAlmacenes';
import AlmacenesImportModal from './AlmacenesImportModal';
import BulkActionsToolbar from "@/components/Shared/BulkActionsToolbar";

// Clean White Input Styles
const glassInputClasses = {
  inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl h-10 data-[hover=true]:border-blue-400 focus-within:!border-blue-500",
  input: "text-slate-700 dark:text-slate-200 text-sm",
};

function Almacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [activeEdit, setActiveEdit] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { hasCreatePermission } = usePermisos();

  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (/^[A-Za-z0-9\s]*$/.test(value)) {
      setSearchTerm(value);
    }
  };

  const estadoToText = (estado) =>
    String(estado) === "1" ? "Activo" : "Inactivo";

  const fetchAlmacenes = async () => {
    const data = await getAlmacenes_A();
    setAlmacenes(data || []);
  };

  useEffect(() => {
    fetchAlmacenes();
  }, []);

  const handleAddAlmacen = (nuevoAlmacen) => {
    setAlmacenes(prev => [
      {
        ...nuevoAlmacen,
        estado_almacen: estadoToText(nuevoAlmacen.estado_almacen)
      },
      ...prev
    ]);
  };

  const handleEditAlmacen = (id_almacen, updatedData) => {
    setAlmacenes(prev =>
      prev.map(almacen =>
        almacen.id_almacen === id_almacen
          ? { ...almacen, ...updatedData, estado_almacen: estadoToText(updatedData.estado_almacen) }
          : almacen
      )
    );
  };

  const removeAlmacen = (id) => {
    setAlmacenes(prev => prev.filter(a => a.id_almacen !== id));
  };

  const handleEdit = (data) => {
    setEditData({
      ...data,
      id_sucursal: data.id_sucursal || data.nombre_sucursal || null,
      estado_almacen: data.estado_almacen === "Activo" ? 1 : 0,
    });
    setActiveEdit(true);
  };

  const handleCloseEdit = () => {
    setEditData(null);
    setActiveEdit(false);
  };

  const filteredAlmacenes = useMemo(() => {
    return almacenes.filter(a => {
      const matchesSearch = (a.nom_almacen || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && a.estado_almacen === 'Activo') ||
        (statusFilter === 'inactive' && a.estado_almacen === 'Inactivo');
      return matchesSearch && matchesStatus;
    });
  }, [almacenes, searchTerm, statusFilter]);

  const handleExport = () => {
    const filtered = filterAlmacenesForExport(almacenes, searchTerm, statusFilter);
    if (!filtered.length) return;
    exportAlmacenesLocal(filtered);
  };

  const handleImportSuccess = () => {
    setImportModalOpen(false);
    fetchAlmacenes();
  };

  const stats = useMemo(() => {
    const total = almacenes.length;
    const active = almacenes.filter(a => a.estado_almacen === 'Activo').length;
    const inactive = almacenes.filter(a => a.estado_almacen === 'Inactivo').length;
    return { total, active, inactive };
  }, [almacenes]);

  // KPI Card - Clean White
  const KpiCard = ({ icon: Icon, value, title, note, iconBgClass, iconTextClass }) => (
    <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
      <CardBody className="flex flex-row items-center gap-4 p-4">
        <div className={`p-3 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          <Icon className={`w-6 h-6 ${iconTextClass}`} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
          {note && <p className="text-[10px] text-slate-400 mt-1">{note}</p>}
        </div>
      </CardBody>
    </Card>
  );

  // Bulk Actions
  const handleBulkActivate = () => alert("Activar masivo próximamente");
  const handleBulkDeactivate = () => alert("Desactivar masivo próximamente");
  const handleBulkDelete = () => alert("Eliminar masivo próximamente");

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-200">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestión de Almacenes
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Administra tus almacenes y sucursales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            className="bg-emerald-50 text-emerald-600 font-semibold"
            startContent={<FaFileExcel />}
            onPress={() => setImportModalOpen(true)}
            isDisabled={!hasCreatePermission}
          >
            Importar
          </Button>
          <Button
            size="sm"
            variant="flat"
            className="bg-indigo-50 text-indigo-600 font-semibold"
            startContent={<FaFileExport />}
            onPress={handleExport}
          >
            Exportar
          </Button>
          <Button
            className="bg-blue-600 text-white font-bold shadow-blue-500/30"
            startContent={<FaPlus />}
            onPress={() => setModalOpen(true)}
            isDisabled={!hasCreatePermission}
          >
            Nuevo Almacén
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={FaWarehouse} value={stats.total} title="Total Almacenes" note="Registrados" iconBgClass="bg-blue-100 dark:bg-blue-900/30" iconTextClass="text-blue-600 dark:text-blue-400" />
        <KpiCard icon={FaCheckCircle} value={stats.active} title="Activos" note="Operativos" iconBgClass="bg-emerald-100 dark:bg-emerald-900/30" iconTextClass="text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={FaTimesCircle} value={stats.inactive} title="Inactivos" note="Fuera de servicio" iconBgClass="bg-rose-100 dark:bg-rose-900/30" iconTextClass="text-rose-600 dark:text-rose-400" />
      </div>

      {/* Filters & Table Wrapper */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl p-4 space-y-4">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
          <Input
            placeholder="Buscar almacén..."
            value={searchTerm}
            onChange={handleSearchChange}
            startContent={<FaSearch className="text-slate-400" />}
            classNames={glassInputClasses}
            isClearable
            onClear={() => setSearchTerm('')}
            className="w-full xl:max-w-xs"
            size="sm"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase mr-2">Estado:</span>
            <Chip
              variant={statusFilter === 'all' ? "solid" : "flat"}
              color={statusFilter === 'all' ? "primary" : "default"}
              onClick={() => setStatusFilter("all")}
              size="sm" className="cursor-pointer"
            >Todos</Chip>
            <Chip
              variant={statusFilter === 'active' ? "solid" : "flat"}
              color="success"
              onClick={() => setStatusFilter("active")}
              size="sm" className="cursor-pointer"
            >Activos</Chip>
            <Chip
              variant={statusFilter === 'inactive' ? "solid" : "flat"}
              color="danger"
              onClick={() => setStatusFilter("inactive")}
              size="sm" className="cursor-pointer"
            >Inactivos</Chip>
          </div>
        </div>

        <TablaAlmacen
          almacenes={filteredAlmacenes}
          updateAlmacenLocal={handleEditAlmacen}
          removeAlmacen={removeAlmacen}
          onEdit={handleEdit}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          page={page}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
        />
      </div>

      {/* Pagination Footer - Outside Table Container */}
      <div className="flex w-full justify-between items-center px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex gap-2 items-center">
          <span className="text-[12px] text-slate-400 dark:text-slate-500">
            {filteredAlmacenes.length} almacenes
          </span>
          <Select
            size="sm"
            className="w-20"
            selectedKeys={[`${limit}`]}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Filas por página"
            classNames={{
              trigger: "min-h-8 h-8 bg-slate-50 dark:bg-zinc-800",
              value: "text-[12px]"
            }}
          >
            <SelectItem key="5">5</SelectItem>
            <SelectItem key="10">10</SelectItem>
            <SelectItem key="15">15</SelectItem>
            <SelectItem key="20">20</SelectItem>
          </Select>
        </div>

        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={Math.ceil(filteredAlmacenes.length / limit) || 1}
          onChange={setPage}
          classNames={{
            cursor: "bg-blue-600 text-white font-bold"
          }}
        />
      </div>

      {activeAdd && (
        <AlmacenesForm
          modalTitle={'Nuevo Almacén'}
          onClose={() => setModalOpen(false)}
          onSuccess={handleAddAlmacen}
          initialData={null}
        />
      )}
      {activeEdit && (
        <AlmacenesForm
          modalTitle={'Editar Almacén'}
          onClose={handleCloseEdit}
          initialData={{ id_almacen: editData.id_almacen, data: editData }}
          onSuccess={handleEditAlmacen}
        />
      )}

      <AlmacenesImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <BulkActionsToolbar
        selectedCount={selectedKeys === "all" ? filteredAlmacenes.length : selectedKeys.size}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedKeys(new Set())}
      />
    </div>
  );
}

export default Almacenes;
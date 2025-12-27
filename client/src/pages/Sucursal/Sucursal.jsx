import { useState, useEffect, useMemo } from 'react';
import { Toaster } from "react-hot-toast";
import { Button, Card, CardBody, Chip, Input, Pagination, Select, SelectItem } from '@heroui/react';
import { FaPlus, FaStore, FaCheckCircle, FaTimesCircle, FaFileExcel, FaFileExport, FaSearch } from "react-icons/fa";
import { usePermisos } from '@/routes';
import { getSucursalData, insertSucursal, editSucursal, removeSucursal } from '@/services/sucursal.services';
import TablaSucursal from './Components/TablaSucursal';
import SucursalForm from './SucursalForm';
import { exportSucursalesLocal, filterSucursalesForExport } from '@/utils/exportSucursales';
import SucursalesImportModal from './SucursalesImportModal';
import BulkActionsToolbar from "@/components/Shared/BulkActionsToolbar";

// Estilos Glass Clean
const glassInputClasses = {
  inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl h-10 data-[hover=true]:border-blue-400 focus-within:!border-blue-500",
  input: "text-slate-700 dark:text-slate-200 text-sm",
};

function Sucursal() {
  const [sucursales, setSucursales] = useState([]);
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

  const fetchSucursales = async () => {
    const { sucursales } = await getSucursalData({});
    setSucursales(sucursales || []);
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  const addSucursal = async (nuevaSucursal) => {
    const ok = await insertSucursal(nuevaSucursal);
    if (ok) fetchSucursales();
  };

  const updateSucursalLocal = async (id, updatedData) => {
    const ok = await editSucursal({ id, ...updatedData });
    if (ok) setSucursales(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const removeSucursalLocal = async (id) => {
    const ok = await removeSucursal(id);
    if (ok) setSucursales(prev => prev.filter(s => s.id !== id));
  };

  const handleEdit = (data) => {
    setEditData(data);
    setActiveEdit(true);
  };

  const handleCloseEdit = () => {
    setEditData(null);
    setActiveEdit(false);
  };

  const filteredSucursales = useMemo(() => {
    return sucursales.filter(s => {
      const matchesSearch = (s.nombre_sucursal || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && s.estado_sucursal === 1) ||
        (statusFilter === 'inactive' && s.estado_sucursal === 0);
      return matchesSearch && matchesStatus;
    });
  }, [sucursales, searchTerm, statusFilter]);

  const handleExport = () => {
    const filtered = filterSucursalesForExport(sucursales, searchTerm, statusFilter);
    if (!filtered.length) return;
    exportSucursalesLocal(filtered);
  };

  const handleImportSuccess = () => {
    setImportModalOpen(false);
    fetchSucursales();
  };

  const stats = useMemo(() => {
    const total = sucursales.length;
    const active = sucursales.filter(s => s.estado_sucursal === 1).length;
    const inactive = sucursales.filter(s => s.estado_sucursal === 0).length;
    return { total, active, inactive };
  }, [sucursales]);

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
            Gestión de Sucursales
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Administra tus sucursales y puntos de venta.
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
            Nueva Sucursal
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={FaStore} value={stats.total} title="Total Sucursales" note="Registradas" iconBgClass="bg-blue-100 dark:bg-blue-900/30" iconTextClass="text-blue-600 dark:text-blue-400" />
        <KpiCard icon={FaCheckCircle} value={stats.active} title="Activas" note="Operativas" iconBgClass="bg-emerald-100 dark:bg-emerald-900/30" iconTextClass="text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={FaTimesCircle} value={stats.inactive} title="Inactivas" note="Cerradas" iconBgClass="bg-rose-100 dark:bg-rose-900/30" iconTextClass="text-rose-600 dark:text-rose-400" />
      </div>

      {/* Filters & Table Wrapper */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl p-4 space-y-4">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
          <Input
            placeholder="Buscar sucursal..."
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

        <TablaSucursal
          sucursales={filteredSucursales}
          updateSucursalLocal={updateSucursalLocal}
          removeSucursal={removeSucursalLocal}
          onEdit={handleEdit}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          page={page}
          limit={limit}
        />
      </div>

      {/* Pagination Footer - Outside Table Container */}
      <div className="flex w-full justify-between items-center px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex gap-2 items-center">
          <span className="text-[12px] text-slate-400 dark:text-slate-500">
            {filteredSucursales.length} sucursales
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
          total={Math.ceil(filteredSucursales.length / limit) || 1}
          onChange={setPage}
          classNames={{
            cursor: "bg-blue-600 text-white font-bold"
          }}
        />
      </div>

      {activeAdd && (
        <SucursalForm
          modalTitle={'Nueva Sucursal'}
          onClose={() => setModalOpen(false)}
          onSuccess={addSucursal}
        />
      )}
      {activeEdit && (
        <SucursalForm
          modalTitle={'Editar Sucursal'}
          onClose={handleCloseEdit}
          initialData={editData}
          onSuccess={(updatedData) => {
            updateSucursalLocal(editData.id, updatedData);
            handleCloseEdit();
          }}
        />
      )}

      <SucursalesImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <BulkActionsToolbar
        selectedCount={selectedKeys === "all" ? filteredSucursales.length : selectedKeys.size}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedKeys(new Set())}
      />
    </div>
  );
}

export default Sucursal;
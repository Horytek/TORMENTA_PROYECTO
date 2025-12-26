import { useState, useEffect, useMemo } from 'react';
import DestinatariosForm from './DestinatariosForm';
import { Toaster } from "react-hot-toast";
import { Button, Card, CardBody, Chip, Input } from '@heroui/react';
import { FaPlus, FaTruck, FaCheckCircle, FaTimesCircle, FaFileExcel, FaFileExport, FaSearch } from "react-icons/fa";
import { usePermisos } from '@/routes';
import { getDestinatarios } from '@/services/destinatario.services';
import TablaProveedor from './Components/TablaProveedor';
import { exportProveedoresLocal, filterProveedoresForExport } from '@/utils/exportProveedores';
import ProveedoresImportModal from './ProveedoresImportModal';
import BulkActionsToolbar from '@/components/Shared/BulkActionsToolbar';

// Estilos Glass Clean
const glassInputClasses = {
  inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl h-10 data-[hover=true]:border-blue-400 focus-within:!border-blue-500",
  input: "text-slate-700 dark:text-slate-200 text-sm",
};

function Proveedores() {
  const [destinatarios, setDestinatarios] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [activeEdit, setActiveEdit] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const { hasCreatePermission } = usePermisos();

  // Input de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) {
      setSearchTerm(value);
    }
  };

  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDestinatarios = async () => {
    const data = await getDestinatarios();
    setDestinatarios(data || []);
  };

  useEffect(() => {
    fetchDestinatarios();
  }, []);

  const addDestinatario = (nuevoDestinatario) => {
    setDestinatarios(prev => [nuevoDestinatario, ...prev]);
  };

  const updateDestinatarioLocal = (id, updatedData) => {
    setDestinatarios(prev =>
      prev.map(d =>
        d.id === id ? { ...d, ...updatedData } : d
      )
    );
  };

  const removeDestinatario = (id) => {
    setDestinatarios(prev => prev.filter(d => d.id !== id));
  };

  const handleEdit = (data) => {
    setEditData(data);
    setActiveEdit(true);
  };

  const handleCloseEdit = () => {
    setEditData(null);
    setActiveEdit(false);
  };

  const filteredDestinatarios = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return destinatarios.filter(d => {
      const name = (d.destinatario || d.nombre || '').toString().toLowerCase();
      const matchesSearch = name.includes(term);
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      const estadoRaw = d.estado || d.estado_destinatario || d.estado_proveedor || d.estado_proveedor;
      const estadoStr = String(estadoRaw).toLowerCase();
      const isActive =
        estadoRaw === 1 ||
        estadoRaw === '1' ||
        estadoRaw === true ||
        estadoStr === 'activo' ||
        estadoStr === 'active';

      if (statusFilter === 'active') return isActive;
      if (statusFilter === 'inactive') return !isActive;
      return true;
    });
  }, [destinatarios, searchTerm, statusFilter]);

  const handleExport = () => {
    const filtered = filterProveedoresForExport(destinatarios, searchTerm);
    if (!filtered.length) return;
    exportProveedoresLocal(filtered);
  };

  const handleImportSuccess = () => {
    setImportModalOpen(false);
    fetchDestinatarios();
  };

  const stats = useMemo(() => {
    const total = destinatarios.length;
    // Mock simulation for stats, ideally filtering real backend data
    return { total };
  }, [destinatarios]);

  // Bulk Actions Handlers
  const handleBulkActivate = () => {
    // Implement Activate Logic (Needs backend update support)
    alert("Activar masivo: Próximamente");
  };
  const handleBulkDeactivate = () => {
    // Implement Deactivate Logic
    alert("Desactivar masivo: Próximamente");
  };
  const handleBulkDelete = () => {
    // Implement Delete Logic 
    alert("Eliminar masivo: Próximamente");
  };

  // KPI Card Style: Clean White
  const KpiCard = ({ icon: Icon, value, title, iconBgClass, iconTextClass }) => (
    <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
      <CardBody className="flex flex-row items-center gap-4 p-4">
        <div className={`p-3 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          <Icon className={`w-6 h-6 ${iconTextClass}`} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-200">
      <Toaster />

      {/* Header & Actions Wrapper */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestión de Proveedores
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Administra tus proveedores, visualiza su estado y gestiona la cadena de suministro.
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
            Nuevo Proveedor
          </Button>
        </div>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={FaTruck}
          value={stats.total}
          title="Total Proveedores"
          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
          iconTextClass="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={FaCheckCircle}
          value={stats.total}
          title="Activos"
          iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
          iconTextClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={FaTimesCircle}
          value={0}
          title="Inactivos"
          iconBgClass="bg-rose-100 dark:bg-rose-900/30"
          iconTextClass="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Filters & Table Wrapper */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl p-4 space-y-4">

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Input
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChange={handleSearchChange}
            startContent={<FaSearch className="text-slate-400" />}
            classNames={glassInputClasses}
            isClearable
            onClear={() => setSearchTerm('')}
            className="w-full md:max-w-xs"
            size="sm"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase mr-2">Estado:</span>
            <Chip
              classname="cursor-pointer transition-all hover:scale-105"
              variant={statusFilter === 'all' ? "solid" : "flat"}
              color={statusFilter === 'all' ? "primary" : "default"}
              onClick={() => setStatusFilter('all')}
              size="sm"
              className="cursor-pointer"
            >
              Todos
            </Chip>
            <Chip
              variant={statusFilter === 'active' ? "solid" : "flat"}
              color="success"
              onClick={() => setStatusFilter('active')}
              size="sm"
              className="cursor-pointer"
            >
              Activos
            </Chip>
            <Chip
              variant={statusFilter === 'inactive' ? "solid" : "flat"}
              color="danger"
              onClick={() => setStatusFilter('inactive')}
              size="sm"
              className="cursor-pointer"
            >
              Inactivos
            </Chip>
          </div>
        </div>

        <TablaProveedor
          destinatarios={filteredDestinatarios}
          updateDestinatarioLocal={updateDestinatarioLocal}
          removeDestinatario={removeDestinatario}
          onEdit={handleEdit}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        />
      </div>

      <BulkActionsToolbar
        selectedCount={selectedKeys === "all" ? filteredDestinatarios.length : selectedKeys.size}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedKeys(new Set())}
      />

      {activeAdd && (
        <DestinatariosForm
          modalTitle={'Nuevo Proveedor'}
          onClose={() => setModalOpen(false)}
          onSuccess={addDestinatario}
        />
      )}
      {activeEdit && (
        <DestinatariosForm
          modalTitle={'Editar Proveedor'}
          onClose={handleCloseEdit}
          initialData={editData}
          onSuccess={(updatedData) => {
            updateDestinatarioLocal(updatedData.id, updatedData);
            handleCloseEdit();
          }}
        />
      )}

      <ProveedoresImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default Proveedores;
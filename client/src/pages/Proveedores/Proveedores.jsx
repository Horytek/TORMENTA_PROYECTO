import { useState, useEffect, useMemo } from 'react';
import DestinatariosForm from './DestinatariosForm';
import { Toaster } from "react-hot-toast";
import { Button, Card, CardBody, Chip } from '@heroui/react';
import { FaPlus, FaTruck, FaCheckCircle, FaTimesCircle, FaFileExcel, FaFileExport } from "react-icons/fa";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getDestinatarios } from '@/services/destinatario.services';
import { ActionButton } from "@/components/Buttons/Buttons";
import TablaProveedor from './Components/TablaProveedor';
import { exportProveedoresLocal, filterProveedoresForExport } from '@/utils/exportProveedores';
import ProveedoresImportModal from './ProveedoresImportModal';

function Proveedores() {
  const [destinatarios, setDestinatarios] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [activeEdit, setActiveEdit] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const { hasCreatePermission } = usePermisos();

  // Input de búsqueda de proveedores
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) {
      setSearchTerm(value);
    }
  };

    // Filtro de estado: 'all' | 'active' | 'inactive'
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDestinatarios = async () => {
    const data = await getDestinatarios();
    setDestinatarios(data || []);
  };

  // Cargar destinatarios solo una vez
  useEffect(() => {
    fetchDestinatarios();
  }, []);

  // Agregar destinatario localmente
  const addDestinatario = (nuevoDestinatario) => {
    setDestinatarios(prev => [nuevoDestinatario, ...prev]);
  };

  // Editar destinatario localmente
  const updateDestinatarioLocal = (id, updatedData) => {
    setDestinatarios(prev =>
      prev.map(d =>
        d.id === id ? { ...d, ...updatedData } : d
      )
    );
  };

  // Eliminar destinatario localmente
  const removeDestinatario = (id) => {
    setDestinatarios(prev => prev.filter(d => d.id !== id));
  };

  // Abrir modal de edición
  const handleEdit = (data) => {
    setEditData(data);
    setActiveEdit(true);
  };

  // Cerrar modal de edición
  const handleCloseEdit = () => {
    setEditData(null);
    setActiveEdit(false);
  };

  // Filtrado
  const filteredDestinatarios = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return destinatarios.filter(d => {
      const name = (d.destinatario || d.nombre || '').toString().toLowerCase();
      const matchesSearch = name.includes(term);

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;

      // Normalizar campo estado en varias formas posibles
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

  // Exportar
  const handleExport = () => {
    const filtered = filterProveedoresForExport(destinatarios, searchTerm);
    if (!filtered.length) return;
    exportProveedoresLocal(filtered);
  };

  // Importar Exitoso
  const handleImportSuccess = () => {
    setImportModalOpen(false);
    fetchDestinatarios();
  };

  // Stats Calculation (Simulated since we don't have status for providers yet, assuming all active for now or just count)
  const stats = useMemo(() => {
    const total = destinatarios.length;
    // Assuming providers don't have a status field yet, we'll just show total. 
    // If they did, we'd count active/inactive.
    return { total };
  }, [destinatarios]);

  // KPI Card Component
const gradients = [
  "from-blue-50 to-white dark:from-blue-900/40 dark:to-[#232339]",
  "from-emerald-50 to-white dark:from-emerald-900/40 dark:to-[#232339]",
  "from-rose-50 to-white dark:from-rose-900/40 dark:to-[#232339]",
  "from-indigo-50 to-white dark:from-indigo-900/40 dark:to-[#232339]"
];
const borders = [
  "border-blue-200/50 dark:border-blue-900/40",
  "border-emerald-200/50 dark:border-emerald-900/40",
  "border-rose-200/50 dark:border-rose-900/40",
  "border-indigo-200/50 dark:border-indigo-900/40"
];
const iconBg = [
  "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
];

const KpiCard = ({ icon, value, title, note, gradient, border, iconColor }) => (
  <Card className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} ${border} shadow-sm backdrop-blur-md`}>
    <CardBody className="p-4">
      <div className="flex flex-col">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold mb-3 shadow-sm ${iconColor}`}>
          {icon}
        </div>
        <div className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
          {typeof value === "number" ? value : (value ?? 0)}
        </div>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-1">{title}</p>
        {note && (
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">{note}</p>
        )}
      </div>
      {/* Fondo decorativo extra para modo oscuro */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className={`absolute inset-0 rounded-xl opacity-40 bg-gradient-to-br ${gradient}`}></div>
      </div>
    </CardBody>
  </Card>
);

  return (
    <div className="mx-2 md:mx-6 my-4 space-y-6">
      <Toaster />

      {/* Header + Search + Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-4xl text-blue-900 dark:text-blue-100 tracking-tight mb-1">
            Gestión de proveedores
          </h1>
          <p className="text-base text-blue-700/80 dark:text-blue-300/80">
            Administra tus proveedores y destinatarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarraSearch
            placeholder="Buscar proveedor..."
            isClearable
            className="h-10 text-sm w-full md:w-72"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <ActionButton
            color="green"
            icon={<FaFileExcel className="w-4 h-4" />}
            onClick={() => setImportModalOpen(true)}
            disabled={!hasCreatePermission}
            size="sm"
            className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-green-50 hover:bg-green-100 text-green-700 transition-colors dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ boxShadow: "none", border: "none" }}
          >
            Importar
          </ActionButton>
          <ActionButton
            color="blue"
            icon={<FaFileExport className="w-4 h-4" />}
            onClick={handleExport}
            size="sm"
            className="h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-200"
            style={{ boxShadow: "none", border: "none" }}
          >
            Exportar
          </ActionButton>
          <ActionButton
            color="blue"
            icon={<FaPlus className="w-4 h-4 text-blue-500" />}
            onClick={() => setModalOpen(true)}
            disabled={!hasCreatePermission}
            size="sm"
            className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Nuevo Proveedor
          </ActionButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={<FaTruck className="w-5 h-5" />}
          value={stats.total}
          title="Total Proveedores"
          note="Registrados en el sistema"
          gradient={gradients[0]}
          border={borders[0]}
          iconColor={iconBg[0]}
        />
        {/* Placeholder cards for future stats */}
        <KpiCard
          icon={<FaCheckCircle className="w-5 h-5" />}
          value={stats.total}
          title="Activos"
          note="Proveedores habilitados"
          gradient={gradients[1]}
          border={borders[1]}
          iconColor={iconBg[1]}
        />
        <KpiCard
          icon={<FaTimesCircle className="w-5 h-5" />}
          value={0}
          title="Inactivos"
          note="Proveedores deshabilitados"
          gradient={gradients[2]}
          border={borders[2]}
          iconColor={iconBg[2]}
        />
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-white/90 dark:bg-[#18192b]/90 border border-blue-100 dark:border-zinc-700 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <FaTruck className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold">Lista de Proveedores</span>
          </div>
                    {/* Estado: label + chips alineados */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                    Estado:
                  </span>
                  <Chip
                    size="sm"
                    variant="flat"
                    className={`cursor-pointer hover:opacity-80 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 ${statusFilter === "all" ? "ring-2 ring-blue-400" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    Todos
                  </Chip>
                  <Chip
                    size="sm"
                    color="success"
                    variant="flat"
                    className={`cursor-pointer hover:opacity-80 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 ${statusFilter === "active" ? "ring-2 ring-emerald-400" : ""}`}
                    onClick={() => setStatusFilter("active")}
                  >
                    Activos
                  </Chip>
                  <Chip
                    size="sm"
                    color="danger"
                    variant="flat"
                    className={`cursor-pointer hover:opacity-80 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 ${statusFilter === "inactive" ? "ring-2 ring-rose-400" : ""}`}
                    onClick={() => setStatusFilter("inactive")}
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
        />
      </div>

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

      {/* Import Modal */}
      <ProveedoresImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default Proveedores;
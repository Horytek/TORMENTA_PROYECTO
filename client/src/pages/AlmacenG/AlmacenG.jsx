import { useState, useEffect, useMemo } from 'react';
import { Toaster } from "react-hot-toast";
import { Button, Card, CardBody, Chip } from '@heroui/react';
import { FaPlus, FaWarehouse, FaCheckCircle, FaTimesCircle, FaFileExcel, FaFileExport } from "react-icons/fa";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getAlmacenes_A } from '@/services/almacen.services';
import { ActionButton } from "@/components/Buttons/Buttons";
import TablaAlmacen from './Components/TablaAlmacen';
import AlmacenesForm from './AlmacenesForm';
import { exportAlmacenesLocal, filterAlmacenesForExport } from '@/utils/exportAlmacenes';
import AlmacenesImportModal from './AlmacenesImportModal';

function Almacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [activeEdit, setActiveEdit] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { hasCreatePermission } = usePermisos();

  // Input de búsqueda
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

  // Cargar almacenes solo una vez
  useEffect(() => {
    fetchAlmacenes();
  }, []);

  // Agregar almacén localmente
  const handleAddAlmacen = (nuevoAlmacen) => {
    setAlmacenes(prev => [
      {
        ...nuevoAlmacen,
        estado_almacen: estadoToText(nuevoAlmacen.estado_almacen)
      },
      ...prev
    ]);
  };

  // Editar almacén localmente
  const handleEditAlmacen = (id_almacen, updatedData) => {
    setAlmacenes(prev =>
      prev.map(almacen =>
        almacen.id_almacen === id_almacen
          ? { ...almacen, ...updatedData, estado_almacen: estadoToText(updatedData.estado_almacen) }
          : almacen
      )
    );
  };

  // Eliminar almacén localmente
  const removeAlmacen = (id) => {
    setAlmacenes(prev => prev.filter(a => a.id_almacen !== id));
  };

  // Abrir modal de edición
  const handleEdit = (data) => {
    setEditData({
      ...data,
      id_sucursal: data.id_sucursal || data.nombre_sucursal || null,
      estado_almacen: data.estado_almacen === "Activo" ? 1 : 0,
    });
    setActiveEdit(true);
  };

  // Cerrar modal de edición
  const handleCloseEdit = () => {
    setEditData(null);
    setActiveEdit(false);
  };

  // Filtrado
  const filteredAlmacenes = useMemo(() => {
    return almacenes.filter(a => {
      const matchesSearch = (a.nom_almacen || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && a.estado_almacen === 'Activo') ||
        (statusFilter === 'inactive' && a.estado_almacen === 'Inactivo');

      return matchesSearch && matchesStatus;
    });
  }, [almacenes, searchTerm, statusFilter]);

  // Exportar
  const handleExport = () => {
    const filtered = filterAlmacenesForExport(almacenes, searchTerm, statusFilter);
    if (!filtered.length) return;
    exportAlmacenesLocal(filtered);
  };

  // Importar Exitoso
  const handleImportSuccess = () => {
    setImportModalOpen(false);
    fetchAlmacenes();
  };

  // Stats Calculation
  const stats = useMemo(() => {
    const total = almacenes.length;
    const active = almacenes.filter(a => a.estado_almacen === 'Activo').length;
    const inactive = almacenes.filter(a => a.estado_almacen === 'Inactivo').length;
    return { total, active, inactive };
  }, [almacenes]);

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
            Gestión de almacenes
          </h1>
          <p className="text-base text-blue-700/80 dark:text-blue-300/80">
            Administra tus almacenes y sucursales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarraSearch
            placeholder="Buscar almacén..."
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
            Nuevo Almacén
          </ActionButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={<FaWarehouse className="w-5 h-5" />}
          value={stats.total}
          title="Total Almacenes"
          note="Registrados en el sistema"
          gradient={gradients[0]}
          border={borders[0]}
          iconColor={iconBg[0]}
        />
        <KpiCard
          icon={<FaCheckCircle className="w-5 h-5" />}
          value={stats.active}
          title="Activos"
          note="Almacenes operativos"
          gradient={gradients[1]}
          border={borders[1]}
          iconColor={iconBg[1]}
        />
        <KpiCard
          icon={<FaTimesCircle className="w-5 h-5" />}
          value={stats.inactive}
          title="Inactivos"
          note="Almacenes fuera de servicio"
          gradient={gradients[2]}
          border={borders[2]}
          iconColor={iconBg[2]}
        />
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-white/90 dark:bg-[#18192b]/90 border border-blue-100 dark:border-zinc-700 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Filtros avanzados alineados */}
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <FaWarehouse className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">Filtros Avanzados</span>
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

        <TablaAlmacen
          almacenes={filteredAlmacenes}
          updateAlmacenLocal={handleEditAlmacen}
          removeAlmacen={removeAlmacen}
          onEdit={handleEdit}
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

      {/* Import Modal */}
      <AlmacenesImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default Almacenes;
import { useEffect, useState, useMemo } from 'react';
import VendedoresForm from './VendedoresForm';
import { Toaster } from "react-hot-toast";
import { FaPlus, FaUsers, FaUserCheck, FaUserTimes, FaInfoCircle, FaBookOpen } from "react-icons/fa";
import { Button, Tabs, Tab, Card, CardBody, Chip, Select, SelectItem, Tooltip,
Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Accordion, AccordionItem } from '@heroui/react';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getVendedores } from '@/services/vendedor.services';
import PagosEmpleados from './PagosEmpleados';
import { ActionButton } from "@/components/Buttons/Buttons";
import TablaEmpleado from './Components/TablaEmpleado';

function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [showManual, setShowManual] = useState (false);
  const { hasCreatePermission } = usePermisos();

  const transformVendedor = (vendedor) => ({
    ...vendedor,
    estado_vendedor:
      vendedor.estado_vendedor === 1 || vendedor.estado_vendedor === "1"
        ? "Activo"
        : "Inactivo",
    nombre: (vendedor.nombres || "") + (vendedor.apellidos ? " " + vendedor.apellidos : ""),
  });

  // Input de búsqueda de vendedores
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Filtro de estado
  const [statusFilter, setStatusFilter] = useState("all");

  // Tab activo
  const [selectedTab, setSelectedTab] = useState("empleados");

  useEffect(() => {
    const fetchVendedores = async () => {
      const data = await getVendedores();
      setVendedores(data);
    };
    fetchVendedores();
  }, []);

  // Al agregar vendedor
  const addVendedor = (nuevoVendedor) => {
    setVendedores(prev => [transformVendedor(nuevoVendedor), ...prev]);
  };

  // Al actualizar vendedor
  const updateVendedorLocal = (dni, updatedData) => {
    setVendedores(prev =>
      prev.map(v =>
        v.dni === dni ? { ...v, ...transformVendedor(updatedData) } : v
      )
    );
  };

  // Eliminar vendedor del array local
  const removeVendedor = (dni) => {
    setVendedores(prev => prev.filter(v => v.dni !== dni));
  };

  // Filtrado
  const filteredVendedores = useMemo(() => {
    return vendedores.filter(v => {
      const matchesSearch = (v.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.dni || "").includes(searchTerm);
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && v.estado_vendedor === "Activo") ||
        (statusFilter === "inactive" && v.estado_vendedor === "Inactivo");
      return matchesSearch && matchesStatus;
    });
  }, [vendedores, searchTerm, statusFilter]);

  // Stats Calculation
  const stats = useMemo(() => {
    const total = vendedores.length;
    const active = vendedores.filter(v => v.estado_vendedor === "Activo").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [vendedores]);

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

  const quickSet = (key) => setStatusFilter(key);

  return (
    <>
      <Toaster />
      <div className="mx-2 md:mx-6 my-4 space-y-6">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
          color="primary"
          className="mb-2"
        >
          <Tab key="empleados" title="Empleados" />
          <Tab key="pagos" title="Pagos de empleados" />
        </Tabs>

        {selectedTab === "empleados" && (
          <>
            {/* Header + Search + Action */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-extrabold text-4xl text-blue-900 dark:text-blue-100 tracking-tight mb-1">
                  Gestión de empleados
                </h1>
                <p className="text-base text-blue-700/80 dark:text-blue-300/80">
                  Administra tu equipo de ventas y personal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Botón Manual de Usuario discreto */}
                <Tooltip content="Ver guía rápida del módulo" placement="bottom">
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-200 font-semibold h-10 rounded-xl px-4 flex items-center gap-2"
                    onPress={() => setManualOpen(true)}
                  >
                    <FaBookOpen className="w-4 h-4" />
                    Manual de Usuario
                  </Button>
                </Tooltip>
                <BarraSearch
                  placeholder="Buscar empleado..."
                  isClearable
                  className="h-10 text-sm w-full md:w-72"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <ActionButton
                  color="blue"
                  icon={<FaPlus className="w-4 h-4 text-blue-500" />}
                  onClick={() => setModalOpen(true)}
                  disabled={!hasCreatePermission}
                  size="sm"
                  className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Nuevo Empleado
                </ActionButton>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                icon={<FaUsers className="w-5 h-5" />}
                value={stats.total}
                title="Total Empleados"
                note="Personal registrado"
                gradient={gradients[0]}
                border={borders[0]}
                iconColor={iconBg[0]}
              />
              <KpiCard
                icon={<FaUserCheck className="w-5 h-5" />}
                value={stats.active}
                title="Activos"
                note="Personal activo"
                gradient={gradients[1]}
                border={borders[1]}
                iconColor={iconBg[1]}
              />
              <KpiCard
                icon={<FaUserTimes className="w-5 h-5" />}
                value={stats.inactive}
                title="Inactivos"
                note="Personal inactivo"
                gradient={gradients[2]}
                border={borders[2]}
                iconColor={iconBg[2]}
              />
            </div>

            {/* (Se eliminó el bloque expandible anterior del manual) */}

            {/* Filters */}
            <div className="rounded-2xl bg-white/90 dark:bg-[#18192b]/90 border border-blue-100 dark:border-zinc-700 p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <FaUsers className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">Filtros Avanzados</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                    Estado:
                  </span>
                  <Chip
                    size="sm"
                    variant="flat"
                    className={`cursor-pointer hover:opacity-80 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 ${statusFilter === "all" ? "ring-2 ring-blue-400" : ""}`}
                    onClick={() => quickSet("all")}
                  >
                    Todos
                  </Chip>
                  <Chip
                    size="sm"
                    color="success"
                    variant="flat"
                    className={`cursor-pointer hover:opacity-80 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 ${statusFilter === "active" ? "ring-2 ring-emerald-400" : ""}`}
                    onClick={() => quickSet("active")}
                  >
                    Activos
                  </Chip>
                  <Chip
                    size="sm"
                    color="danger"
                    variant="flat"
                    className={`cursor-pointer hover:opacity-80 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 ${statusFilter === "inactive" ? "ring-2 ring-rose-400" : ""}`}
                    onClick={() => quickSet("inactive")}
                  >
                    Inactivos
                  </Chip>
                </div>
              </div>

              {/* Table */}
              <TablaEmpleado
                vendedores={filteredVendedores}
                addVendedor={addVendedor}
                updateVendedorLocal={updateVendedorLocal}
                removeVendedor={removeVendedor}
              />
            </div>

            {activeAdd && (
              <VendedoresForm
                modalTitle={'Nuevo Vendedor'}
                onClose={() => setModalOpen(false)}
                onSuccess={addVendedor}
              />
            )}
          </>
        )}

        {selectedTab === "pagos" && (
          <Card className="mt-2">
            <CardBody>
              <PagosEmpleados vendedores={vendedores} />
            </CardBody>
          </Card>
        )}
      </div>

      {/* Modal Manual de Usuario */}
      <Modal
        isOpen={manualOpen}
        onClose={() => setManualOpen(false)}
        size="lg"
        backdrop="blur"
        scrollBehavior="inside"
      >
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-bold text-lg">
                <FaBookOpen className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                Manual de Usuario - Gestión de Empleados
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Guía rápida para maximizar el uso del módulo
              </span>
            </ModalHeader>
            <ModalBody>
              <Accordion variant="splitted">
                <AccordionItem key="conceptos" title="Conceptos Básicos">
                  <ul className="text-xs space-y-2">
                    <li>Un empleado se vincula a un usuario del sistema. La relación es 1 a 1.</li>
                    <li>El estado (Activo/Inactivo) controla si aparece en procesos (pagos, asignaciones).</li>
                    <li>Los datos editados se reflejan inmediatamente sin recargar.</li>
                  </ul>
                </AccordionItem>
                <AccordionItem key="usuario" title="Asignación / Cambio de Usuario">
                  <ul className="text-xs space-y-2">
                    <li>Seleccione siempre un usuario libre; los usados se muestran deshabilitados.</li>
                    <li>Para cambiar usuario abra Editar y elija otro disponible.</li>
                    <li>Si ninguno está libre, cree uno nuevo con el mini-modal (+ Usuario).</li>
                  </ul>
                </AccordionItem>
                <AccordionItem key="estados" title="Estados y Semáforo">
                  <ul className="text-xs space-y-2">
                    <li>Activo: participa en cálculos y listados del módulo Pagos.</li>
                    <li>Inactivo: conserva histórico pero se excluye de automatizaciones.</li>
                    <li>Cambiar a Inactivo no elimina registros ni pagos previos.</li>
                  </ul>
                </AccordionItem>
                <AccordionItem key="pagos" title="Pagos y Reportes">
                  <ul className="text-xs space-y-2">
                    <li>El tab Pagos usa la lista actual de empleados activos.</li>
                    <li>Si no aparece un nuevo empleado: verifique su estado y que se guardó correctamente.</li>
                    <li>Los recibos o boletas se generan desde acciones dentro de Pagos Empleados.</li>
                  </ul>
                </AccordionItem>
                <AccordionItem key="buenas" title="Buenas Prácticas">
                  <ul className="text-xs space-y-2">
                    <li>Mantenga nombres completos para mejorar la búsqueda.</li>
                    <li>Revise duplicados antes de crear para evitar registros redundantes.</li>
                    <li>Use filtros rápidos (Todos / Activos / Inactivos) para validar estados tras ediciones.</li>
                  </ul>
                </AccordionItem>
              </Accordion>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                color="danger"
                onPress={() => setManualOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                color="primary"
                onPress={() => setManualOpen(false)}
              >
                Entendido
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}

export default Vendedores;
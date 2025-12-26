import { useEffect, useState, useMemo } from 'react';
import VendedoresForm from './VendedoresForm';
import { Toaster } from "react-hot-toast";
import { FaPlus, FaUsers, FaUserCheck, FaUserTimes, FaBookOpen, FaSearch } from "react-icons/fa";
import {
  Button, Tabs, Tab, Card, CardBody, Chip, Tooltip, Input,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Accordion, AccordionItem
} from '@heroui/react';
import { usePermisos } from '@/routes';
import { getVendedores } from '@/services/vendedor.services';
import PagosEmpleados from './PagosEmpleados';
import TablaEmpleado from './Components/TablaEmpleado';
import BulkActionsToolbar from "@/components/Shared/BulkActionsToolbar";

// Estilos Glass Clean
const glassInputClasses = {
  inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl h-10 data-[hover=true]:border-blue-400 focus-within:!border-blue-500",
  input: "text-slate-700 dark:text-slate-200 text-sm",
};

function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const { hasCreatePermission } = usePermisos();

  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const transformVendedor = (vendedor) => ({
    ...vendedor,
    estado_vendedor:
      vendedor.estado_vendedor === 1 || vendedor.estado_vendedor === "1"
        ? "Activo"
        : "Inactivo",
    nombre: (vendedor.nombres || "") + (vendedor.apellidos ? " " + vendedor.apellidos : ""),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("empleados");

  useEffect(() => {
    const fetchVendedores = async () => {
      const data = await getVendedores();
      setVendedores(data);
    };
    fetchVendedores();
  }, []);

  const addVendedor = (nuevoVendedor) => {
    setVendedores(prev => [transformVendedor(nuevoVendedor), ...prev]);
  };

  const updateVendedorLocal = (dni, updatedData) => {
    setVendedores(prev =>
      prev.map(v =>
        v.dni === dni ? { ...v, ...transformVendedor(updatedData) } : v
      )
    );
  };

  const removeVendedor = (dni) => {
    setVendedores(prev => prev.filter(v => v.dni !== dni));
  };

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

  const stats = useMemo(() => {
    const total = vendedores.length;
    const active = vendedores.filter(v => v.estado_vendedor === "Activo").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [vendedores]);

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
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        color="primary"
        classNames={{
          cursor: "bg-blue-600",
          tab: "data-[selected=true]:text-blue-600"
        }}
      >
        <Tab key="empleados" title="Empleados" />
        <Tab key="pagos" title="Pagos de empleados" />
      </Tabs>

      {selectedTab === "empleados" && (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Gestión de Empleados
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Administra tu equipo de ventas y personal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content="Ver guía rápida del módulo" placement="bottom">
                <Button
                  size="sm"
                  variant="flat"
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-semibold h-10 rounded-xl px-4 flex items-center gap-2"
                  onPress={() => setManualOpen(true)}
                >
                  <FaBookOpen className="w-4 h-4" />
                  Manual
                </Button>
              </Tooltip>
              <Button
                className="bg-blue-600 text-white font-bold shadow-blue-500/30"
                startContent={<FaPlus />}
                onPress={() => setModalOpen(true)}
                isDisabled={!hasCreatePermission}
              >
                Nuevo Empleado
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard icon={FaUsers} value={stats.total} title="Total Empleados" note="Registrados" iconBgClass="bg-blue-100 dark:bg-blue-900/30" iconTextClass="text-blue-600 dark:text-blue-400" />
            <KpiCard icon={FaUserCheck} value={stats.active} title="Activos" note="Habilitados" iconBgClass="bg-emerald-100 dark:bg-emerald-900/30" iconTextClass="text-emerald-600 dark:text-emerald-400" />
            <KpiCard icon={FaUserTimes} value={stats.inactive} title="Inactivos" note="Deshabilitados" iconBgClass="bg-rose-100 dark:bg-rose-900/30" iconTextClass="text-rose-600 dark:text-rose-400" />
          </div>

          {/* Filters & Table Wrapper */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl p-4 space-y-4">
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
              <Input
                placeholder="Buscar empleado..."
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

            <TablaEmpleado
              vendedores={filteredVendedores}
              addVendedor={addVendedor}
              updateVendedorLocal={updateVendedorLocal}
              removeVendedor={removeVendedor}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
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
        <Card>
          <CardBody>
            <PagosEmpleados vendedores={vendedores} />
          </CardBody>
        </Card>
      )}

      <BulkActionsToolbar
        selectedCount={selectedKeys === "all" ? filteredVendedores.length : selectedKeys.size}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedKeys(new Set())}
      />

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
              <span className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg">
                <FaBookOpen className="w-4 h-4 text-blue-600" />
                Manual de Usuario - Empleados
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
              <Button variant="light" color="danger" onPress={() => setManualOpen(false)}>Cerrar</Button>
              <Button color="primary" onPress={() => setManualOpen(false)}>Entendido</Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Vendedores;
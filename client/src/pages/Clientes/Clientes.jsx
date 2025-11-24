import { useState, useEffect } from 'react';
import { Toaster } from "react-hot-toast";
import { FaPlus, FaUsers, FaUserCheck, FaUserTimes, FaChartLine } from "react-icons/fa";
import { Button, Card, CardBody, Tabs, Tab, Chip, Select, SelectItem, Input } from "@heroui/react";
import TablaCliente from '@/pages/Clientes/ComponentsClientes/TablaCliente';
import useGetClientes from "@/services/client_data/getClientes";
import AddClientModal from './ComponentsClientes/AddClient';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { ActionButton } from "@/components/Buttons/Buttons";
import { getClientStatsRequest } from "@/api/api.cliente";

function Clientes() {
  const { hasCreatePermission } = usePermisos();

  // Estado de Modal de Agregar Cliente
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive

  // Stats
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0, nuevos_mes: 0 });

  // Hook que solo consulta la BD una vez, el resto es local
  const { clientes, metadata, loading, error, refetch, setAllClientes } = useGetClientes();

  useEffect(() => {
    loadStats();
  }, [clientes]); // Recargar stats cuando cambian los clientes

  const loadStats = async () => {
    try {
      const res = await getClientStatsRequest();
      if (res.data.code === 1) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Error loading stats", error);
    }
  };

  // Refetch seguro (normaliza docType)
  const safeRefetch = (p = 1, l = limit, dt = docType, dn = docNumber, st = searchTerm) => {
    const normalized = (dt || "").toLowerCase(); // backend espera 'dni' | 'ruc' | ''
    refetch(p, l, normalized, dn, st);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);
    safeRefetch(1, limit, docType, docNumber, value);
  };

  const handleFilterChange = (filterData) => {
    const { docType: newDocType, newDocNumber } = filterData;
    setDocType(newDocType);
    setDocNumber(newDocNumber);
    setPage(1);
    refetch(1, limit, newDocType, newDocNumber, searchTerm);
  };

  const changePage = (newPage) => {
    setPage(newPage);
    safeRefetch(newPage);
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    safeRefetch(1, newLimit);
  };

  // Filtrado local por estado para los tabs
  const filteredClientes = clientes.filter(c => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return c.estado === 1 || c.estado === "1";
    if (statusFilter === "inactive") return c.estado === 0 || c.estado === "0";
    return true;
  });

  // NUEVO: estilo KPI compacto (como imagen de referencia)
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

  // Quick filters estilo Usuarios (chips)
  const quickSet = (key) => {
    setStatusFilter(key);
  };


  return (
    <>
      <Toaster />
      <div className="mx-2 md:mx-6 my-4 space-y-6">
        {/* Header simplificado + búsqueda + acción (igual a Usuarios) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-4xl text-blue-900 dark:text-blue-100 tracking-tight mb-1">
              Gestión de clientes
            </h1>
            <p className="text-base text-blue-700/80 dark:text-blue-300/80">
              Administra tu cartera y visualiza su actividad.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BarraSearch
              placeholder="Buscar por cliente..."
              isClearable
              className="h-10 text-sm w-full md:w-72"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <ActionButton
              color="blue"
              icon={<FaPlus className="w-4 h-4 text-blue-500" />}
              onClick={handleModalAdd}
              disabled={!hasCreatePermission}
              size="sm"
              className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              Nuevo Cliente
            </ActionButton>
          </div>
        </div>

        {/* KPI Cards (nuevo estilo) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<FaUsers className="w-5 h-5" />}
            value={stats.total}
            title="Total Clientes"
            note="Clientes registrados"
            gradient={gradients[0]}
            border={borders[0]}
            iconColor={iconBg[0]}
          />
          <KpiCard
            icon={<FaUserCheck className="w-5 h-5" />}
            value={stats.activos}
            title="Activos"
            note="Con estado activo"
            gradient={gradients[1]}
            border={borders[1]}
            iconColor={iconBg[1]}
          />
          <KpiCard
            icon={<FaUserTimes className="w-5 h-5" />}
            value={stats.inactivos}
            title="Inactivos"
            note="Sin actividad"
            gradient={gradients[2]}
            border={borders[2]}
            iconColor={iconBg[2]}
          />
          <KpiCard
            icon={<FaChartLine className="w-5 h-5" />}
            value={stats.nuevos_mes}
            title="Nuevos este Mes"
            note="Alta reciente"
            gradient={gradients[3]}
            border={borders[3]}
            iconColor={iconBg[3]}
          />
        </div>

        {/* Filtros avanzados estilo Usuarios */}
        <div className="rounded-2xl bg-white/90 dark:bg-[#18192b]/90 border border-blue-100 dark:border-zinc-700 p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <FaUsers className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">Filtros Avanzados</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                label="Tipo Doc."
                placeholder="Todos"
                size="sm"
                selectedKeys={docType ? [docType] : []}
                onSelectionChange={(keys) => {
                  const raw = Array.from(keys)[0] || "";
                  const v = raw.toLowerCase(); // asegurar minúsculas
                  setDocType(v);
                  setPage(1);
                  safeRefetch(1, limit, v, docNumber);
                }}
                className="w-32"
              >
                <SelectItem key="">Todos</SelectItem>
                <SelectItem key="dni">DNI</SelectItem>
                <SelectItem key="ruc">RUC</SelectItem>
              </Select>
              <Input
                label="Nro. Doc."
                size="sm"
                placeholder={docType === "ruc" ? "Ingrese RUC" : docType === "dni" ? "Ingrese DNI" : "Número"}
                value={docNumber}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setDocNumber(v);
                  setPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    safeRefetch(1, limit, docType, e.target.value.trim());
                  }
                }}
                className="w-40"
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-blue-800/30 w-full" />

            {/* Quick filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                Vistas rápidas:
              </span>
              <Chip
                size="sm"
                variant="flat"
                className={`cursor-pointer hover:opacity-80 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 ${statusFilter === "all"
                    ? "ring-2 ring-blue-400"
                    : ""
                  }`}
                onClick={() => quickSet("all")}
              >
                Todos
              </Chip>
              <Chip
                size="sm"
                color="success"
                variant="flat"
                className={`cursor-pointer hover:opacity-80 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 ${statusFilter === "active"
                    ? "ring-2 ring-emerald-400"
                    : ""
                  }`}
                onClick={() => quickSet("active")}
              >
                Solo Activos
              </Chip>
              <Chip
                size="sm"
                color="danger"
                variant="flat"
                className={`cursor-pointer hover:opacity-80 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300 ${statusFilter === "inactive"
                    ? "ring-2 ring-rose-400"
                    : ""
                  }`}
                onClick={() => quickSet("inactive")}
              >
                Solo Inactivos
              </Chip>
            </div>
          </div>

          {/* Tabla */}
          <TablaCliente
            clientes={filteredClientes}
            loading={loading}
            error={error}
            metadata={metadata}
            page={page}
            limit={limit}
            changePage={changePage}
            changeLimit={changeLimit}
            onDelete={() => {
              safeRefetch(page);
              loadStats();
            }}
            onEdit={() => {
              safeRefetch(page);
              loadStats();
            }}
            setAllClientes={setAllClientes}
          />
          <AddClientModal
            open={activeAdd}
            onClose={handleModalAdd}
            refetch={() => {
              safeRefetch(page);
              loadStats();
            }}
            setAllClientes={setAllClientes}
          />
        </div>
      </div> {/* Cierra contenedor principal */}
    </>
  );
}

export default Clientes;

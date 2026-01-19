import { useState, useEffect } from 'react';
import { FaPlus, FaUsers, FaUserCheck, FaUserTimes, FaChartLine, FaSearch } from "react-icons/fa";
import { Button, Card, CardBody, Chip, Select, SelectItem, Input, Pagination } from "@heroui/react";
import { motion } from "framer-motion";
import TablaCliente from '@/pages/Clientes/ComponentsClientes/TablaCliente';
import { useGetClientes } from "@/services/clientes.services";
import AddClientModal from './ComponentsClientes/AddClient';
import { usePermisos } from '@/routes';
import { getClientStatsRequest } from "@/api/api.cliente";

import { bulkUpdateClientes } from "@/services/clientes.services";

import ConfirmationModal from "@/components/Modals/ConfirmationModal";


// Estilos Glass Clean
const glassInputClasses = {
  inputWrapper: "bg-white dark:bg-zinc-800 shadow-none border-none rounded-2xl h-10 group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-zinc-800 ring-0 transition-all duration-300",
  input: "text-slate-600 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500",
};

function Clientes() {
  const { hasCreatePermission } = usePermisos();

  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");



  // Stats
  const [stats, setStats] = useState({ total: 0, activos: 0, inactivos: 0, nuevos_mes: 0 });

  const { clientes, metadata, loading, error, refetch, setAllClientes } = useGetClientes();

  useEffect(() => {
    loadStats();
  }, [clientes]);

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

  const safeRefetch = (p = 1, l = limit, dt = docType, dn = docNumber, st = searchTerm) => {
    const normalized = (dt || "").toLowerCase();
    refetch(p, l, normalized, dn, st);
  };

  // Search Logic
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);
    safeRefetch(1, limit, docType, docNumber, value);
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

  const filteredClientes = clientes.filter(c => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return c.estado === 1 || c.estado === "1";
    if (statusFilter === "inactive") return c.estado === 0 || c.estado === "0";
    return true;
  });

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




  return (

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-200"
    >


      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestión de Clientes
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Administra tu cartera y visualiza su actividad en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-blue-600 text-white font-bold shadow-blue-500/30"
            startContent={<FaPlus />}
            onPress={handleModalAdd}
            isDisabled={!hasCreatePermission}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={FaUsers}
          value={stats.total}
          title="Total Clientes"
          note="Registrados"
          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
          iconTextClass="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={FaUserCheck}
          value={stats.activos}
          title="Activos"
          note="Habilitados"
          iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
          iconTextClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={FaUserTimes}
          value={stats.inactivos}
          title="Inactivos"
          note="Deshabilitados"
          iconBgClass="bg-rose-100 dark:bg-rose-900/30"
          iconTextClass="text-rose-600 dark:text-rose-400"
        />
        <KpiCard
          icon={FaChartLine}
          value={stats.nuevos_mes}
          title="Nuevos (Mes)"
          note="Alta reciente"
          iconBgClass="bg-indigo-100 dark:bg-indigo-900/30"
          iconTextClass="text-indigo-600 dark:text-indigo-400"
        />
      </div>

      {/* Filters & Table Wrapper */}
      <div className="space-y-4">

        {/* Filters */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">

          <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={handleSearchChange}
              startContent={<FaSearch className="text-slate-400" />}
              classNames={glassInputClasses}
              isClearable
              onClear={() => setSearchTerm('')}
              className="w-full sm:w-64"
              size="sm"
            />
            <div className="flex gap-2">
              <Select
                placeholder="Doc."
                size="sm"
                selectedKeys={docType ? [docType] : []}
                onChange={(e) => {
                  const v = e.target.value.toLowerCase();
                  setDocType(v);
                  setPage(1);
                  safeRefetch(1, limit, v, docNumber);
                }}
                className="w-24"
                classNames={{ trigger: glassInputClasses.inputWrapper, value: glassInputClasses.input }}
              >
                <SelectItem key="dni">DNI</SelectItem>
                <SelectItem key="ruc">RUC</SelectItem>
              </Select>
              <Input
                placeholder="Nro Doc."
                size="sm"
                value={docNumber}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setDocNumber(v);
                  setPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') safeRefetch(1, limit, docType, e.target.value.trim());
                }}
                className="w-32"
                classNames={glassInputClasses}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase mr-2">Estado:</span>
            <Chip
              className="cursor-pointer transition-all hover:scale-105"
              variant={statusFilter === 'all' ? "solid" : "flat"}
              color={statusFilter === 'all' ? "primary" : "default"}
              onClick={() => setStatusFilter("all")}
              size="sm"
            >
              Todos
            </Chip>
            <Chip
              variant={statusFilter === 'active' ? "solid" : "flat"}
              color="success"
              onClick={() => setStatusFilter("active")}
              size="sm"
              className="cursor-pointer"
            >
              Activos
            </Chip>
            <Chip
              variant={statusFilter === 'inactive' ? "solid" : "flat"}
              color="danger"
              onClick={() => setStatusFilter("inactive")}
              size="sm"
              className="cursor-pointer"
            >
              Inactivos
            </Chip>
          </div>
        </div>

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
      </div>

      {/* Pagination Footer - Outside Table Container */}
      <div className="flex w-full justify-between items-center px-2 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="flex gap-2 items-center">
          <span className="text-[12px] text-slate-400 dark:text-slate-500">
            {metadata?.total || metadata?.total_records || 0} clientes
          </span>
          <Select
            size="sm"
            className="w-20"
            selectedKeys={[`${limit}`]}
            onChange={(e) => changeLimit(Number(e.target.value))}
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
          total={metadata?.pages || metadata?.total_pages || 1}
          onChange={changePage}
          classNames={{
            cursor: "bg-blue-600 text-white font-bold"
          }}
        />
      </div>






      <AddClientModal
        open={activeAdd}
        onClose={handleModalAdd}
        refetch={() => {
          safeRefetch(page);
          loadStats();
        }}
        setAllClientes={setAllClientes}
      />
    </motion.div>
  );
}

export default Clientes;

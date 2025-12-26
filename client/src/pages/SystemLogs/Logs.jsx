import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import TablaLogs from './ComponentsLogs/TablaLogs';
import { Pagination, Card, CardBody, Tabs, Tab } from '@heroui/react';
import { getSystemLogs } from '../../api/api.logs';
import { FaClipboardList, FaUserCheck, FaExclamationTriangle } from "react-icons/fa";

export default function LogsPage() {
  const [allLogs, setAllLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState("24h");

  const load = async () => {
    try {
      setLoading(true);
      // Load more logs to enable client-side filtering
      const data = await getSystemLogs(1, 500);
      const logsArray = Array.isArray(data.data?.data) ? data.data.data : [];
      setAllLogs(logsArray);
      setTotal(data.data?.total || logsArray.length);
    } catch (e) {
      console.error('❌ Error loading logs:', e);
      if (e.name === 'SyntaxError' && e.message.includes('JSON')) {
        toast.error('Error de autenticación o el servidor devolvió HTML en lugar de JSON');
      } else {
        toast.error(`Error cargando logs: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filter logs by time period
  const filteredLogs = useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (timeFilter) {
      case "24h":
        cutoffDate.setHours(cutoffDate.getHours() - 24);
        break;
      case "semana":
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case "mes":
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case "anio":
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      default:
        cutoffDate.setHours(cutoffDate.getHours() - 24);
    }

    return allLogs.filter(log => {
      const logDate = new Date(log.fecha);
      return logDate >= cutoffDate && logDate <= now;
    });
  }, [allLogs, timeFilter]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredLogs.slice(start, start + limit);
  }, [filteredLogs, page, limit]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredLogs.length / limit)), [filteredLogs.length, limit]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [timeFilter]);

  // Stats based on filtered logs
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const logins = filteredLogs.filter(l => l.accion?.includes('LOGIN')).length;
    const errors = filteredLogs.filter(l => l.accion?.includes('FAIL') || l.accion?.includes('RECHAZ')).length;
    return { total, logins, errors };
  }, [filteredLogs]);

  // KPI Card - Clean White
  const KpiCard = ({ icon: Icon, value, title, iconBgClass, iconTextClass }) => (
    <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
      <CardBody className="flex flex-row items-center gap-4 p-4">
        <div className={`p-3 rounded-xl flex items-center justify-center ${iconBgClass}`}>
          <Icon className={`w-5 h-5 ${iconTextClass}`} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
      </CardBody>
    </Card>
  );

  // Get label for current filter
  const getFilterLabel = () => {
    switch (timeFilter) {
      case "24h": return "últimas 24 horas";
      case "semana": return "última semana";
      case "mes": return "último mes";
      case "anio": return "último año";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-200">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Logs del Sistema
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Registros de actividad y auditoría del sistema.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={FaClipboardList}
          value={stats.total}
          title={`Registros (${getFilterLabel()})`}
          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
          iconTextClass="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={FaUserCheck}
          value={stats.logins}
          title="Inicios de Sesión"
          iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
          iconTextClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={FaExclamationTriangle}
          value={stats.errors}
          title="Errores/Rechazos"
          iconBgClass="bg-rose-100 dark:bg-rose-900/30"
          iconTextClass="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl p-4 space-y-4">

        {/* Time Filter Tabs */}
        <Tabs
          aria-label="Filtro de tiempo"
          selectedKey={timeFilter}
          onSelectionChange={(key) => setTimeFilter(key)}
          variant="light"
          classNames={{
            base: "w-full max-w-md",
            tabList: "bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg gap-0",
            tab: "px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-md data-[selected=true]:bg-white data-[selected=true]:text-slate-900 data-[selected=true]:shadow-sm dark:data-[selected=true]:bg-zinc-700 dark:data-[selected=true]:text-white",
            cursor: "hidden",
          }}
        >
          <Tab key="24h" title="Ult. 24hrs" />
          <Tab key="semana" title="Ult. Semana" />
          <Tab key="mes" title="Ult. mes" />
          <Tab key="anio" title="Ult. año" />
        </Tabs>

        <TablaLogs
          logs={paginatedLogs}
          loading={loading}
        />
      </div>

      {/* Pagination Footer - Outside Table Container */}
      <div className="flex w-full justify-between items-center px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <span className="text-[12px] text-slate-400 dark:text-slate-500">
          Mostrando {paginatedLogs.length} de {filteredLogs.length} registros ({getFilterLabel()})
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={totalPages}
          onChange={setPage}
          classNames={{
            cursor: "bg-blue-600 text-white font-bold"
          }}
        />
      </div>
    </div>
  );
}

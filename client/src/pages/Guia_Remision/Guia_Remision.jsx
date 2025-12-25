import { useState, useMemo } from 'react';
import { MdAddCircleOutline } from 'react-icons/md';
import { Card, CardBody, Button, Tooltip } from "@heroui/react";
import { Truck, FileText, CheckCircle, XCircle } from "lucide-react";
import TablaGuias from './ComponentsGuias/GuiasTable';
import FiltrosGuias from './ComponentsGuias/FiltrosGuias';
import { useNavigate } from "react-router-dom";
import useGuiasRemision from '@/hooks/useGuiasRemision';
import { usePermisos } from '@/routes';

const Guia_Remision = () => {
  const [filters, setFilters] = useState({});
  const {
    guias,
    setGuias,
    loading,
    refreshGuias
  } = useGuiasRemision(filters); // Assuming hook exposes refreshGuias or similar, if not we rely on filters change

  const navigate = useNavigate();
  const { hasCreatePermission } = usePermisos();

  const handleFiltersChange = (newFilters) => {
    setFilters(prev => JSON.stringify(prev) !== JSON.stringify(newFilters) ? newFilters : prev);
  };

  const handleGuiaAnulada = (guiaId) => {
    setGuias(prev => prev.map(guia => guia.id === guiaId ? { ...guia, estado: 'Inactivo' } : guia));
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = guias.length;
    const activas = guias.filter(g => g.estado === 'Activo').length;
    const anuladas = guias.filter(g => g.estado !== 'Activo').length; // Assuming 'Inactivo' or others
    return { total, activas, anuladas };
  }, [guias]);

  // Clean White Classes
  const cardClass = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl";

  const KpiCard = ({ title, value, icon: Icon, colorClass }) => (
    <Card className={`${cardClass} border-none shadow-sm`}>
      <CardBody className="flex flex-row items-center gap-4 p-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-').replace('/10', '')} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-6 md:p-8 font-inter">
      <div className="max-w-[1920px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1e293b] dark:text-white tracking-tight">
              Guías de Remisión
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
              Gestión de traslados y documentos de transporte.
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip content={!hasCreatePermission ? "Sin permisos" : "Crear nueva guía"}>
              <Button
                className={`bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
                startContent={<MdAddCircleOutline size={20} />}
                onPress={() => hasCreatePermission && navigate('/almacen/guia_remision/registro_guia')}
                isDisabled={!hasCreatePermission}
              >
                Nueva Guía
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="Total Guías"
            value={kpis.total}
            icon={FileText}
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <KpiCard
            title="Guías Activas"
            value={kpis.activas}
            icon={CheckCircle}
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <KpiCard
            title="Guías Anuladas"
            value={kpis.anuladas}
            icon={XCircle}
            colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          />
        </div>

        {/* Filters & Table */}
        <div className="space-y-4">
          <FiltrosGuias
            onFiltersChange={handleFiltersChange}
            onRefresh={() => setFilters({ ...filters })} // Trigger re-fetch
          />
          <TablaGuias
            guias={guias}
            onGuiaAnulada={handleGuiaAnulada}
          />
        </div>

      </div>
    </div>
  );
};

export default Guia_Remision;
import { SalesReportPanel } from "@/features/sales/components/shared/SalesReportPanel";

/**
 * Historial de ventas (/reports/sales). Reutiliza el panel de reportes del
 * feature `sales` para no duplicar la lógica de listado/estadísticas de ventas.
 */
export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header compacto */}
      <div className="shrink-0 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Historial de ventas</h1>
        <p className="text-sm text-muted-foreground mt-1">Consulta y filtra los comprobantes emitidos.</p>
      </div>
      {/* Panel ocupa todo el espacio restante */}
      <div className="flex-1 min-h-0">
        <SalesReportPanel />
      </div>
    </div>
  );
}

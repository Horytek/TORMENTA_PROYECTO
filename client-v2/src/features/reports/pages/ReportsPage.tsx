import { SalesReportPanel } from "@/features/sales/components/shared/SalesReportPanel";

/**
 * Historial de ventas (/reports/sales). Reutiliza el panel de reportes del
 * feature `sales` para no duplicar la lógica de listado/estadísticas de ventas.
 */
export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Historial de ventas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta y filtra los comprobantes emitidos.
        </p>
      </div>
      <SalesReportPanel />
    </div>
  );
}

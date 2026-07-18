import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertTriangle } from "lucide-react";
import { getResumenContable } from "../api/accounting";

function StatTile({ label, value, tone, icon: Icon }: { label: string; value: string; tone?: "positive" | "negative"; icon: typeof Wallet }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className={`num mt-1.5 text-xl font-bold ${tone === "positive" ? "text-emerald-600" : tone === "negative" ? "text-destructive" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

export function AccountingDashboardPanel() {
  const { data: resumen, isLoading } = useQuery({ queryKey: ["resumen-contable"], queryFn: () => getResumenContable({}) });

  if (isLoading || !resumen) {
    return <p className="text-sm text-muted-foreground">Cargando resumen contable...</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Periodo: {resumen.fechaInicio} — {resumen.fechaFin}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Ingresos" value={`S/ ${resumen.ingresos.toFixed(2)}`} tone="positive" icon={TrendingUp} />
        <StatTile label="Egresos" value={`S/ ${resumen.egresos.toFixed(2)}`} tone="negative" icon={TrendingDown} />
        <StatTile
          label="Utilidad neta"
          value={`S/ ${resumen.utilidadNeta.toFixed(2)}${resumen.variacionUtilidad !== null ? ` (${resumen.variacionUtilidad > 0 ? "+" : ""}${resumen.variacionUtilidad}%)` : ""}`}
          tone={resumen.utilidadNeta >= 0 ? "positive" : "negative"}
          icon={PiggyBank}
        />
        <StatTile label="Flujo de caja" value={`S/ ${resumen.flujoCaja.toFixed(2)}`} tone={resumen.flujoCaja >= 0 ? "positive" : "negative"} icon={Wallet} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Saldo disponible en tesorería</p>
          <p className={`num mt-1.5 text-xl font-bold ${resumen.saldoDisponible >= 0 ? "text-foreground" : "text-destructive"}`}>
            S/ {resumen.saldoDisponible.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Presupuesto total del periodo</p>
          <p className="num mt-1.5 text-xl font-bold text-foreground">
            S/ {resumen.indicadorPresupuestario.totalPresupuestado.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">{resumen.indicadorPresupuestario.cuentasConPresupuesto} cuenta(s) con presupuesto asignado</p>
        </div>
      </div>

      {resumen.alertas.length > 0 && (
        <div className="space-y-2">
          {resumen.alertas.map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {a.mensaje}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

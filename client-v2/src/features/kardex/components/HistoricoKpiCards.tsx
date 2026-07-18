import {
  Package,
  Archive,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface HistoricoKpiData {
  /** Stock actual real (de la tabla producto). */
  stockInventario: number;
  /** Cantidad de filas del rango con entra > 0. */
  countEntradas: number;
  /** Cantidad de filas del rango con sale > 0. */
  countSalidas: number;
  /** Suma de entradas en el rango. */
  entradasActual: number;
  /** Suma de salidas en el rango. */
  salidasActual: number;
  /** Stock calculado antes del rango. */
  stockPrev: number;
  /** Entradas previas (acumulado antes del rango). */
  entradasPrev: number;
  /** Salidas previas (acumulado antes del rango). */
  salidasPrev: number;
  /** Rotación (sale/entra) en %. */
  rotacion: number;
  /** Velocidad de venta u/día. */
  velocidadVenta: number;
  /** Días estimados para agotar stock. */
  diasParaAgotar: number | "—";
  /** Precio unitario actual (de la última venta real). */
  precioUnitActual: number;
  /** Precio unitario previo (estimado). */
  precioUnitPrev: number;
  /** Total de ingresos por ventas en el rango. */
  totalIngresos: number;
  /** % crecimiento entradas vs. periodo anterior. */
  porcentajeCrecimiento: string;
}

interface HistoricoKpiCardsProps {
  data: HistoricoKpiData;
}

function estadoStock(
  stock: number
): { label: string; tone: string; msg: string } {
  if (stock <= 5)
    return {
      label: "Stock Bajo",
      tone: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
      msg: "Inventario crítico.",
    };
  if (stock >= 30)
    return {
      label: "Stock Alto",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      msg: "Inventario suficiente.",
    };
  return {
    label: "Stock Medio",
    tone: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800",
    msg: "Inventario nivel medio.",
  };
}

function KpiCard({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-indigo-500 transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function HistoricoKpiCards({ data }: HistoricoKpiCardsProps) {
  const valorTotalActual = Math.max(0, data.stockInventario * data.precioUnitActual);
  const valorTotalPrev = Math.max(0, data.stockPrev * data.precioUnitPrev);

  const estado = estadoStock(data.stockInventario);
  const proximoPedido =
    typeof data.diasParaAgotar === "number" && data.diasParaAgotar > 0
      ? `En ${data.diasParaAgotar} días`
      : "Sin estimar";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Histórico */}
      <KpiCard title="Histórico" Icon={Package}>
        <div className="mb-3 grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Entradas (conteo)</p>
            <p className="num text-lg font-bold text-blue-600">{data.countEntradas}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Salidas (conteo)</p>
            <p className="num text-lg font-bold text-rose-600">{data.countSalidas}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-muted-foreground">Rotación</span>
            <span className="num font-bold">{data.rotacion.toFixed(1)}%</span>
          </div>
          <ProgressBar value={data.rotacion} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Stock Inicial</span>
          <span className="num text-sm font-bold">
            {data.stockPrev.toLocaleString("es-PE")} unid.
          </span>
        </div>
      </KpiCard>

      {/* Stock Actual */}
      <KpiCard title="Stock Actual" Icon={Archive}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="num text-3xl font-extrabold">
              {data.stockInventario.toLocaleString("es-PE")}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Unidades disponibles
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-bold",
              estado.tone
            )}
          >
            {estado.label}
          </span>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" /> +{data.entradasActual.toLocaleString("es-PE")}
            </div>
            <p className="mt-0.5 text-[10px] font-medium uppercase text-emerald-700/70 dark:text-emerald-300/70">
              Entradas
            </p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-center dark:border-rose-900/40 dark:bg-rose-950/30">
            <div className="flex items-center justify-center gap-1 text-sm font-bold text-rose-700 dark:text-rose-300">
              <TrendingDown className="h-3.5 w-3.5" /> -{data.salidasActual.toLocaleString("es-PE")}
            </div>
            <p className="mt-0.5 text-[10px] font-medium uppercase text-rose-700/70 dark:text-rose-300/70">
              Salidas
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/70">{estado.msg}</p>
      </KpiCard>

      {/* Financiero */}
      <KpiCard title="Financiero" Icon={DollarSign}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Ingresos Totales</p>
            <p className="num text-xl font-bold text-emerald-600">
              S/ {data.totalIngresos.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {data.porcentajeCrecimiento}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between border-b border-dashed border-border py-1 text-xs">
            <span className="text-muted-foreground">Valor Total (Stock)</span>
            <span className="num font-semibold">
              S/ {valorTotalActual.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-border py-1 text-xs">
            <span className="text-muted-foreground">Valor Inicial</span>
            <span className="num font-semibold">
              S/ {valorTotalPrev.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between py-1 text-xs">
            <span className="text-muted-foreground">Velocidad</span>
            <span className="num font-semibold">{data.velocidadVenta} u/día</span>
          </div>
        </div>

        <div className="mt-3 text-right">
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
            {proximoPedido}
          </span>
        </div>
      </KpiCard>
    </div>
  );
}
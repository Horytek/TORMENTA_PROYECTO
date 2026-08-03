import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, PackageX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportReportButton } from "@/components/shared/ExportReportButton";
import { cn } from "@/lib/utils";
import { getStockAging } from "../api/reportes";
import type { RangoAntiguedad } from "../types";

const RANGOS: { key: RangoAntiguedad; label: string; toneCard: string; toneBadge: "success" | "warning" | "destructive" | "secondary" }[] = [
  { key: "0-30", label: "0-30 días (fresco)", toneCard: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30", toneBadge: "success" },
  { key: "31-60", label: "31-60 días", toneCard: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30", toneBadge: "warning" },
  { key: "61-90", label: "61-90 días", toneCard: "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30", toneBadge: "warning" },
  { key: "90+", label: "90+ días (hueso)", toneCard: "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30", toneBadge: "destructive" },
];

/**
 * Antigüedad de Stock (Aging Report): clasifica el stock actual por cuántos
 * días pasaron desde su última entrada real (no traslados). Sugiere qué
 * liquidar — un producto en "90+" con harto stock es candidato a promoción.
 */
export function StockAgingReport() {
  const { data = [], isLoading } = useQuery({ queryKey: ["reporte-stock-aging"], queryFn: getStockAging });
  const [filtro, setFiltro] = useState<RangoAntiguedad | null>(null);

  const conteos = useMemo(() => {
    const map = new Map<RangoAntiguedad, number>();
    for (const item of data) map.set(item.rango, (map.get(item.rango) ?? 0) + 1);
    return map;
  }, [data]);

  const filtrados = useMemo(
    () => (filtro ? data.filter((d) => d.rango === filtro) : data),
    [data, filtro]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RANGOS.map((r) => (
          <button
            key={r.key}
            onClick={() => setFiltro((prev) => (prev === r.key ? null : r.key))}
            className={cn(
              "rounded-lg border p-3 text-left transition-all",
              r.toneCard,
              filtro === r.key ? "ring-2 ring-brand" : "opacity-90 hover:opacity-100"
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">{r.label}</p>
            <p className="num mt-1 text-xl font-bold">{conteos.get(r.key) ?? 0}</p>
          </button>
        ))}
      </div>

      <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand" />
            <CardTitle className="text-sm font-bold text-foreground">
              Productos por antigüedad {filtro && <span className="font-normal text-muted-foreground">— {filtro}</span>}
            </CardTitle>
          </div>
          <ExportReportButton
            filename="antiguedad_stock"
            title="Antigüedad de Stock"
            headers={["Producto", "Marca", "Stock", "Días sin reponer", "Rango"]}
            rows={filtrados.map((p) => [p.descripcion, p.nom_marca ?? "-", p.stock, p.dias_sin_movimiento ?? "-", p.rango])}
          />
        </CardHeader>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <PackageX className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sin productos con stock en este rango.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">Marca</th>
                  <th className="px-4 py-2 text-right">Stock</th>
                  <th className="px-4 py-2 text-right">Días sin reponer</th>
                  <th className="px-4 py-2 text-right">Rango</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.map((p) => {
                  const rango = RANGOS.find((r) => r.key === p.rango);
                  return (
                    <tr key={p.id_producto} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium text-foreground">{p.descripcion}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.nom_marca ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{p.stock.toLocaleString("es-PE")}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{p.dias_sin_movimiento ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge variant={rango?.toneBadge ?? "secondary"} className="text-[10px]">{p.rango}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { AdaptiveCard } from "@/components/shared/AdaptiveCollection";
import type { FieldDef } from "@/components/shared/AdaptiveCollection";
import { getPL } from "../api/accounting";

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

interface SummaryTile {
  id: string;
  label: string;
  value: number;
}

const tileFields: FieldDef<SummaryTile>[] = [
  { key: "value", priority: "primary", semantic: "kpi", label: "" },
];

export function PLPanel() {
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(todayIso());

  const { data: pl, isFetching } = useQuery({
    queryKey: ["expenses-pl", fechaInicio, fechaFin],
    queryFn: () => getPL(fechaInicio, fechaFin),
  });

  const ingresos = pl?.ingresos ?? 0;
  const gastos = pl?.gastos ?? 0;
  const utilidad = pl?.utilidad ?? 0;

  const tiles: SummaryTile[] = [
    { id: "ingresos", label: "Ingresos", value: ingresos },
    { id: "gastos", label: "Gastos", value: gastos },
    { id: "utilidad", label: "Utilidad", value: utilidad },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9" />
        </div>
        {isFetching && <Spinner size="sm" />}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((tile, i) => (
          <AdaptiveCard<SummaryTile>
            key={tile.id}
            item={tile}
            index={i}
            fields={tileFields.map((f) => ({ ...f, label: tile.label }))}
            variant="stat-tile"
            getItemId={(t) => t.id}
            state={tile.id === "utilidad" ? (utilidad >= 0 ? "active" : "error") : "neutral"}
          />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Gastos por categoría</h3>
        </div>
        <div className="divide-y divide-border/60">
          {(pl?.gastosPorCategoria ?? []).length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin gastos en el período seleccionado.</p>
          ) : (
            pl?.gastosPorCategoria.map((g, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <Badge variant="secondary" className="font-normal">{g.categoria}</Badge>
                <span className="num text-sm font-semibold text-foreground">S/ {Number(g.total).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

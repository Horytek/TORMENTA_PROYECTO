import { Fragment, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportReportButton } from "@/components/shared/ExportReportButton";
import { getVentasHeatmap } from "../api/reportes";

// DAYOFWEEK de MySQL: 1=domingo … 7=sábado.
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HORAS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Mapa de calor de horas pico: cantidad de ventas por hora × día de la
 * semana, para decidir turnos de caja. Escala secuencial de un solo tono
 * (variando opacidad) — no hay categorías que distinguir, solo magnitud,
 * así que un solo color es más legible que un arcoíris.
 */
export function SalesHeatmapReport() {
  const { data = [], isLoading } = useQuery({ queryKey: ["reporte-ventas-heatmap"], queryFn: getVentasHeatmap });

  const { grid, max, totalVentas, horaPico, diaPico } = useMemo(() => {
    const grid = new Map<string, number>();
    let max = 0;
    let totalVentas = 0;
    const porHora = new Array(24).fill(0);
    const porDia = new Array(8).fill(0);

    for (const p of data) {
      grid.set(`${p.dia_semana}:${p.hora}`, p.ventas);
      max = Math.max(max, p.ventas);
      totalVentas += p.ventas;
      porHora[p.hora] += p.ventas;
      porDia[p.dia_semana] += p.ventas;
    }

    const horaPico = porHora.indexOf(Math.max(...porHora));
    const diaPico = porDia.indexOf(Math.max(...porDia));

    return { grid, max, totalVentas, horaPico, diaPico: diaPico > 0 ? diaPico : null };
  }, [data]);

  return (
    <div className="space-y-4">
      {totalVentas > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm">
          <Flame className="h-4 w-4 text-brand" />
          <span>
            Hora pico: <strong>{String(horaPico).padStart(2, "0")}:00</strong>
            {diaPico && <> — Día con más ventas: <strong>{DIAS[diaPico - 1]}</strong></>}
          </span>
        </div>
      )}

      <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-brand" />
            <CardTitle className="text-sm font-bold text-foreground">Ventas por hora y día</CardTitle>
          </div>
          <ExportReportButton
            filename="horas_pico"
            title="Ventas por Hora y Día"
            headers={["Día", "Hora", "Ventas"]}
            rows={data.map((p) => [DIAS[p.dia_semana - 1] ?? p.dia_semana, `${String(p.hora).padStart(2, "0")}:00`, p.ventas])}
          />
        </CardHeader>
        <CardContent className="overflow-x-auto px-5 py-4">
          {isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-muted/30" />
          ) : totalVentas === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">Todavía no hay ventas registradas para armar el mapa de calor.</p>
          ) : (
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[2.5rem_repeat(24,1fr)] gap-0.5">
                <div />
                {HORAS.map((h) => (
                  <div key={h} className="text-center text-[9px] text-muted-foreground">{h}</div>
                ))}
                {DIAS.map((dia, i) => {
                  const diaSemana = i + 1; // 1=domingo
                  return (
                    <Fragment key={dia}>
                      <div className="flex items-center text-[10px] font-medium text-muted-foreground">{dia}</div>
                      {HORAS.map((hora) => {
                        const valor = grid.get(`${diaSemana}:${hora}`) ?? 0;
                        const intensidad = max > 0 ? valor / max : 0;
                        return (
                          <div
                            key={`${dia}-${hora}`}
                            title={`${dia} ${String(hora).padStart(2, "0")}:00 — ${valor} venta${valor === 1 ? "" : "s"}`}
                            className="aspect-square rounded-sm"
                            style={{ backgroundColor: `rgba(5, 150, 105, ${0.08 + intensidad * 0.85})` }}
                          />
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">Más oscuro = más ventas en ese horario.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

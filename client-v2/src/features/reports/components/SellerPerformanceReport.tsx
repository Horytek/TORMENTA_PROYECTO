import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportReportButton } from "@/components/shared/ExportReportButton";
import { getComisiones } from "@/features/employees/api/vendedores";

const soles = (v: unknown) => `S/ ${Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const primerDiaDelMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const hoy = () => new Date().toISOString().slice(0, 10);

/**
 * Rendimiento por vendedor: ticket promedio y UPT (unidades por ticket) —
 * cuántas prendas se llevan por venta, no solo cuánto venden. Reusa
 * `getComisiones` (ya trae cantidad_ventas/total_ventas/comisión); esta
 * pantalla solo le agrega la lectura de rendimiento, no una consulta nueva.
 */
export function SellerPerformanceReport() {
  const [fechaInicio, setFechaInicio] = useState(primerDiaDelMes());
  const [fechaFin, setFechaFin] = useState(hoy());

  const { data: vendedores = [], isLoading } = useQuery({
    queryKey: ["reporte-rendimiento-vendedores", fechaInicio, fechaFin],
    queryFn: () => getComisiones({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
  });

  const ordenados = [...vendedores].sort((a, b) => Number(b.upt) - Number(a.upt));
  const mejorUpt = ordenados[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Desde</Label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-8 w-36 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Hasta</Label>
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-8 w-36 text-xs" />
        </div>
      </div>

      {mejorUpt && Number(mejorUpt.upt) > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm">
          <Trophy className="h-4 w-4 text-brand" />
          <span><strong>{mejorUpt.nombre}</strong> lidera con {Number(mejorUpt.upt).toFixed(1)} prendas por ticket.</span>
        </div>
      )}

      <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            <CardTitle className="text-sm font-bold text-foreground">Rendimiento por vendedor</CardTitle>
          </div>
          <ExportReportButton
            filename="rendimiento_vendedores"
            title="Rendimiento por Vendedor"
            headers={["Vendedor", "Tickets", "Unidades", "UPT", "Ticket promedio", "Comisión"]}
            rows={ordenados.map((v) => [
              v.nombre, v.cantidad_ventas, Number(v.unidades_vendidas),
              Number(v.upt).toFixed(1), Number(v.ticket_promedio).toFixed(2),
              v.comision != null ? Number(v.comision).toFixed(2) : "-",
            ])}
          />
        </CardHeader>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}
            </div>
          ) : ordenados.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">Sin ventas atribuidas a vendedores en este periodo.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Vendedor</th>
                  <th className="px-4 py-2 text-right">Tickets</th>
                  <th className="px-4 py-2 text-right">Unidades</th>
                  <th className="px-4 py-2 text-right">UPT</th>
                  <th className="px-4 py-2 text-right">Ticket promedio</th>
                  <th className="px-4 py-2 text-right">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ordenados.map((v) => (
                  <tr key={v.dni} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium text-foreground">{v.nombre}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{v.cantidad_ventas}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{Number(v.unidades_vendidas).toLocaleString("es-PE")}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-brand">{Number(v.upt).toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{soles(v.ticket_promedio)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{v.comision != null ? soles(v.comision) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

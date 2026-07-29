import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getComisiones } from "../api/vendedores";

const soles = (v: unknown) => `S/ ${Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const primerDiaDelMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const hoy = () => new Date().toISOString().slice(0, 10);

/** Comisión = ventas atribuidas al vendedor × su % configurado (vendedor.porcentaje_comision). */
export function ComisionesPanel() {
  const [fechaInicio, setFechaInicio] = useState(primerDiaDelMes());
  const [fechaFin, setFechaFin] = useState(hoy());

  const { data: comisiones = [], isLoading } = useQuery({
    queryKey: ["comisiones", fechaInicio, fechaFin],
    queryFn: () => getComisiones({ fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
  });

  const totalComision = comisiones.reduce((sum, c) => sum + Number(c.comision ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9" />
        </div>
      </div>

      <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : comisiones.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Sin ventas atribuidas a un vendedor en este periodo.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Vendedor</th>
                  <th className="px-4 py-2.5 text-right">Ventas</th>
                  <th className="px-4 py-2.5 text-right">Total vendido</th>
                  <th className="px-4 py-2.5 text-right">Meta</th>
                  <th className="px-4 py-2.5 text-right">% Comisión</th>
                  <th className="px-4 py-2.5 text-right">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comisiones.map((c) => {
                  const pctMeta = c.pct_meta != null ? Number(c.pct_meta) : null;
                  return (
                    <tr key={c.dni} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium text-foreground">{c.nombre}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{c.cantidad_ventas}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{soles(c.total_ventas)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {c.meta_mensual != null ? (
                          <span className={pctMeta != null && pctMeta >= 100 ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                            {pctMeta?.toFixed(0)}% de {soles(c.meta_mensual)}
                          </span>
                        ) : "Sin meta"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {c.porcentaje_comision != null ? `${Number(c.porcentaje_comision).toFixed(1)}%` : "Sin configurar"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                        {c.comision != null ? soles(c.comision) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/20 font-semibold">
                  <td className="px-4 py-2.5" colSpan={5}>Total a pagar en comisiones</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{soles(totalComision)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Solo se atribuyen ventas registradas después de activar esta función (ventas anteriores quedan sin vendedor asignado).
        Configura el % de comisión en la ficha de cada empleado.
      </p>
    </div>
  );
}

import { useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MargenProducto } from "../types";
import { clasificarBcg, CUADRANTE_LABEL, CUADRANTE_COLOR, type CuadranteBcg } from "../lib/bcg";

interface BcgMatrixProps {
  productos: MargenProducto[];
}

/**
 * Matriz BCG: volumen vendido (eje X) vs. margen % (eje Y), partida por la
 * mediana del propio periodo. Cada cuadrante lleva su nombre como texto
 * directo sobre el gráfico — el color por sí solo no alcanza (ámbar↔esmeralda
 * cae en la banda de advertencia del validador de accesibilidad), así que la
 * etiqueta es la codificación real, el color es refuerzo.
 */
export function BcgMatrix({ productos }: BcgMatrixProps) {
  const { puntos, medianaUnidades, medianaMargen } = useMemo(() => clasificarBcg(productos), [productos]);

  if (puntos.length < 2) return null;

  const porCuadrante = (cuadrante: CuadranteBcg) => puntos.filter((p) => p.cuadrante === cuadrante);

  const maxUnidades = Math.max(...puntos.map((p) => p.producto.unidades));
  const maxMargen = Math.max(...puntos.map((p) => p.producto.porcentaje as number));
  const minMargen = Math.min(...puntos.map((p) => p.producto.porcentaje as number));

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="px-5 py-4 border-b border-border">
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
          Matriz de rentabilidad
        </CardTitle>
        <p className="text-[10px] text-muted-foreground font-medium">
          Qué tanto se vende vs. cuánto deja — partido por la mediana de este periodo
        </p>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 24, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                type="number"
                dataKey="unidades"
                name="Unidades vendidas"
                domain={[0, Math.ceil(maxUnidades * 1.1)]}
                className="text-[10px] fill-muted-foreground font-medium"
                tickLine={false}
                axisLine={false}
                label={{ value: "Unidades vendidas", position: "insideBottom", offset: -4, fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                type="number"
                dataKey="porcentaje"
                name="Margen %"
                domain={[Math.floor(Math.min(0, minMargen) * 1.1), Math.ceil(maxMargen * 1.1)]}
                className="text-[10px] fill-muted-foreground font-medium"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={44}
              />
              <ZAxis range={[70, 70]} />
              <ReferenceLine x={medianaUnidades} stroke="var(--border)" strokeDasharray="4 4" />
              <ReferenceLine y={medianaMargen} stroke="var(--border)" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "0.5rem",
                  fontSize: "11px",
                  color: "var(--foreground)",
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof puntos)[number]["producto"] & { cuadrante: CuadranteBcg };
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
                      <p className="font-semibold text-foreground">{p.descripcion}</p>
                      <p className="text-muted-foreground">{CUADRANTE_LABEL[p.cuadrante]}</p>
                      <p className="mt-1 text-foreground">
                        {p.unidades} unid. · {p.porcentaje}% margen
                      </p>
                    </div>
                  );
                }}
              />
              {(Object.keys(CUADRANTE_LABEL) as CuadranteBcg[]).map((cuadrante) => (
                <Scatter
                  key={cuadrante}
                  name={CUADRANTE_LABEL[cuadrante]}
                  data={porCuadrante(cuadrante).map((p) => ({ ...p.producto, cuadrante: p.cuadrante }))}
                  fill={CUADRANTE_COLOR[cuadrante]}
                >
                  {porCuadrante(cuadrante).map((p) => (
                    <Cell key={p.producto.id_producto} fill={CUADRANTE_COLOR[cuadrante]} />
                  ))}
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda con nombre — el color solo no basta para distinguir cuadrantes. */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
          {(Object.keys(CUADRANTE_LABEL) as CuadranteBcg[]).map((cuadrante) => (
            <div key={cuadrante} className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CUADRANTE_COLOR[cuadrante] }} />
              <span className="text-[10px] text-muted-foreground">{CUADRANTE_LABEL[cuadrante]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

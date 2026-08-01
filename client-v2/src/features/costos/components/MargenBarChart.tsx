import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MargenProducto } from "../types";

const soles = (v: number) => `S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Ganancia vs. pérdida es polaridad (bueno/malo), no una serie categórica —
// mismos dos colores que ya usa la tabla de abajo para margen positivo/negativo.
const COLOR_GANANCIA = "#059669";
const COLOR_PERDIDA = "#e11d48";

interface MargenBarChartProps {
  productos: MargenProducto[];
}

/** Top 8 productos por ganancia neta real (ingreso con costo conocido menos costo), de mayor a menor. */
export function MargenBarChart({ productos }: MargenBarChartProps) {
  const data = useMemo(() => {
    return [...productos]
      .filter((p) => p.porcentaje != null)
      .sort((a, b) => b.margen - a.margen)
      .slice(0, 8)
      .map((p) => ({
        nombre: p.descripcion.trim().length > 22 ? `${p.descripcion.trim().slice(0, 22)}…` : p.descripcion.trim(),
        margen: p.margen,
      }));
  }, [productos]);

  if (data.length === 0) return null;

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="px-5 py-4 border-b border-border">
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
          Ganancia neta por prenda
        </CardTitle>
        <p className="text-[10px] text-muted-foreground font-medium">Top {data.length} del periodo, de mayor a menor</p>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
              <XAxis
                type="number"
                tickFormatter={(v) => soles(Number(v))}
                className="text-[10px] fill-muted-foreground font-medium"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                width={140}
                className="text-[10px] fill-muted-foreground font-medium"
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine x={0} stroke="var(--border)" />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "0.5rem",
                  fontSize: "11px",
                  color: "var(--foreground)",
                }}
                formatter={(value: number) => [soles(value), "Ganancia"]}
              />
              <Bar dataKey="margen" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {data.map((d) => (
                  <Cell key={d.nombre} fill={d.margen >= 0 ? COLOR_GANANCIA : COLOR_PERDIDA} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

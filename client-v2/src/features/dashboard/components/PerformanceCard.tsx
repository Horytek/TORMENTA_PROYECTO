import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { DesempenoSucursal } from "../api/dashboard";

interface PerformanceCardProps {
  sucursales: DesempenoSucursal[];
  promedioGeneral: number;
  loading?: boolean;
}

const BAR_COLORS = [
  "bg-blue-500 dark:bg-blue-600",
  "bg-indigo-500 dark:bg-indigo-600",
  "bg-violet-500 dark:bg-violet-600",
  "bg-fuchsia-500 dark:bg-fuchsia-600",
];

export function PerformanceCard({ sucursales, promedioGeneral, loading }: PerformanceCardProps) {
  return (
    <Card className="border border-border shadow-sm rounded-xl overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row justify-between items-center px-5 py-4 border-b border-border">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
            Rendimiento
          </CardTitle>
          <p className="text-[10px] text-muted-foreground font-medium">Ventas por sucursal</p>
        </div>
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <TrendingUp size={14} strokeWidth={2.5} />
        </div>
      </CardHeader>

      <CardContent className="px-5 py-4 flex-1 flex flex-col justify-between">
        <div className="max-h-[300px] overflow-y-auto w-full space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : sucursales.length > 0 ? (
            <ul className="space-y-4">
              {sucursales.map((branch, index) => {
                const sales = Number(branch.ventas) || 0;
                // Max for demo progress calculation
                const maxSales = Math.max(...sucursales.map(s => Number(s.ventas) || 0), 10000);
                const percent = Math.min((sales / maxSales) * 100, 100);
                const barColor = BAR_COLORS[index % BAR_COLORS.length];

                return (
                  <li key={branch.id || branch.nombre || index} className="space-y-1.5 group">
                    <div className="flex justify-between items-end text-xs">
                      <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                        {branch.nombre}
                      </span>
                      <span className="num font-bold text-foreground tabular-nums">
                        S/ {sales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p className="text-xs">Sin datos disponibles</p>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-border flex justify-between items-center">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Promedio
          </span>
          <span className="num text-sm font-bold text-foreground tabular-nums">
            S/ {promedioGeneral?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

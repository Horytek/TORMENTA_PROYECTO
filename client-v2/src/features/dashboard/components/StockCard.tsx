import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle } from "lucide-react";
import type { StockCriticoProduct } from "../api/dashboard";

interface StockCardProps {
  productos: StockCriticoProduct[];
  loading?: boolean;
}

export function StockCard({ productos, loading }: StockCardProps) {
  return (
    <Card className="border border-border shadow-sm rounded-xl overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row justify-between items-center px-5 py-4 border-b border-border">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
            Stock Crítico
          </CardTitle>
          <p className="text-[10px] text-muted-foreground font-medium">Atención requerida</p>
        </div>
        <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle size={14} strokeWidth={2.5} />
        </div>
      </CardHeader>

      <CardContent className="px-0 py-0 flex-1 overflow-hidden">
        <div className="max-h-[300px] overflow-y-auto w-full">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 animate-pulse">
                  <div className="space-y-1 w-2/3">
                    <div className="h-3.5 bg-muted rounded w-3/4"></div>
                    <div className="h-2.5 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-5 bg-muted rounded w-10"></div>
                </div>
              ))}
            </div>
          ) : productos.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-muted-foreground font-semibold bg-muted/30 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-2">Producto</th>
                  <th className="px-4 py-2 text-center">Stock</th>
                  <th className="px-4 py-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productos.map((prod, idx) => {
                  const stockNum = Number(prod.stock) || 0;
                  const isCritical = stockNum <= 2;
                  const isWarning = stockNum > 2 && stockNum <= 5;

                  return (
                    <tr
                      key={prod.id || prod.codigo || idx}
                      className="hover:bg-muted/30 transition-colors cursor-default group"
                    >
                      <td className="px-5 py-2.5 max-w-[140px]">
                        <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {prod.nombre}
                        </p>
                        <p className="num text-[9px] text-muted-foreground">{prod.codigo || "S/C"}</p>
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-foreground tabular-nums">
                        {prod.stock}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge
                          variant={isCritical ? "destructive" : isWarning ? "warning" : "secondary"}
                          className="text-[9px] font-bold px-1.5 py-0 rounded"
                        >
                          {isCritical ? "Crítico" : "Bajo"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-muted/10 mx-4 my-4 rounded-xl border border-dashed border-border">
              <Package size={24} className="mb-2 opacity-50" />
              <p className="text-xs font-medium">Todo en orden</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

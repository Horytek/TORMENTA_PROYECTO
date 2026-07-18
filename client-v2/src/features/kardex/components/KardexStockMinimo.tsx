import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageSearch, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  getKardexInventarioStockMinimo as getKardexStockMinimo,
  type KardexInventarioStockMinimo as KardexStockMinimo,
} from "@/features/kardex-inventario/api/kardexInventario";

interface KardexStockMinimoProps {
  /** Sucursal opcional para filtrar por sede (id_sucursal). */
  sucursal?: number;
}

export function KardexStockMinimo({ sucursal }: KardexStockMinimoProps) {
  const {
    data: productos = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<KardexStockMinimo[]>({
    queryKey: ["kardex-stock-minimo", sucursal ?? null],
    queryFn: () => getKardexStockMinimo(sucursal),
  });

  const sinStock = productos.filter((p) => Number(p.stock) <= 0).length;
  const criticos = productos.length - sinStock;

  return (
    <div className="space-y-4">
      {/* Header resumen */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="num tabular-nums">{productos.length}</span>
            <span>productos con stock crítico</span>
          </div>
          {sinStock > 0 && (
            <Badge variant="destructive" className="num tabular-nums">
              {sinStock} sin stock
            </Badge>
          )}
          {criticos > 0 && (
            <Badge variant="warning" className="num tabular-nums">
              {criticos} stock bajo
            </Badge>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isFetching && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">Todo en orden</h3>
            <p className="text-sm text-muted-foreground">
              No hay productos con stock por debajo del mínimo.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="pr-4 text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => {
                const stock = Number(p.stock ?? 0);
                const sinStock = stock <= 0;
                return (
                  <TableRow key={p.codigo}>
                    <TableCell className="num pl-4 text-xs text-muted-foreground">
                      {p.codigo}
                    </TableCell>
                    <TableCell className="max-w-[26rem] truncate text-sm font-medium text-foreground">
                      {p.nombre}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.marca || "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Badge
                        variant={sinStock ? "destructive" : "warning"}
                        className="num tabular-nums"
                      >
                        {stock.toLocaleString("es-PE")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
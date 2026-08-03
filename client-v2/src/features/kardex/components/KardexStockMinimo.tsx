import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AdaptiveDataView, type ColumnDef } from "@/components/shared/AdaptiveDataView";

import {
  getKardexInventarioStockMinimo as getKardexStockMinimo,
  type KardexInventarioStockMinimo as KardexStockMinimo,
} from "@/features/kardex-inventario/api/kardexInventario";

interface KardexStockMinimoProps {
  /** Sucursal opcional para filtrar por sede (id_sucursal). */
  sucursal?: number;
}

const columns: ColumnDef<KardexStockMinimo>[] = [
  { key: "codigo", header: "Código" },
  { key: "nombre", header: "Producto" },
  { key: "marca", header: "Marca", render: (p) => p.marca || "—" },
  {
    key: "stock",
    header: "Stock",
    render: (p) => {
      const stock = Number(p.stock ?? 0);
      return (
        <Badge variant={stock <= 0 ? "destructive" : "warning"} className="num tabular-nums">
          {stock.toLocaleString("es-PE")}
        </Badge>
      );
    },
  },
];

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

      {!isLoading && productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-12 text-center">
          <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">Todo en orden</h3>
          <p className="text-sm text-muted-foreground">
            No hay productos con stock por debajo del mínimo.
          </p>
        </div>
      ) : (
        <AdaptiveDataView
          title="Stock crítico"
          data={productos}
          columns={columns}
          loading={isFetching}
          searchFields={["nombre", "marca"]}
          onRefresh={() => refetch()}
          defaultLayout="table"
        />
      )}
    </div>
  );
}

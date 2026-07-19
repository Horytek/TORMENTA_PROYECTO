import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import {
  Package,
  AlertTriangle,
  FileText,
  Inbox,
  Search,
  PackageSearch,
  RefreshCw,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  getKardexInventarioProductos,
  getKardexInventarioAlmacenes,
  getKardexInventarioStockMinimo,
  type KardexInventarioProducto,
} from "@/features/kardex-inventario/api/kardexInventario";
import { KardexDetalle } from "../components/KardexDetalle";
import { KardexStockMinimo } from "../components/KardexStockMinimo";

const money = (v: unknown) => `S/ ${Number(v ?? 0).toFixed(2)}`;

type KardexTab = "catalogo" | "stock-minimo" | "detalle" | "solicitudes";
type StockFilter = "" | "todos" | "con_stock" | "sin_stock";

export default function KardexPage() {
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("catalogo" as KardexTab));
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [almacen, setAlmacen] = useQueryState("alm", parseAsString.withDefault(""));
  const [stock, setStock] = useQueryState("stock", parseAsString.withDefault("con_stock"));

  // El módulo "kardex-inventario" NO usa variantes: lee directo de la tabla `inventario`
  // y devuelve un shape "limpio" (sin producto_sku/tonalidad/talla).
  const { data: almacenes = [] } = useQuery({
    queryKey: ["kardex-inventario-almacenes"],
    queryFn: getKardexInventarioAlmacenes,
  });

  const { data: productos = [], isLoading } = useQuery<KardexInventarioProducto[]>({
    queryKey: ["kardex-inventario-productos", { almacen, stock }],
    queryFn: () =>
      getKardexInventarioProductos({
        almacen,
        stock: stock as StockFilter,
      }),
  });

  // Para badge en la pestaña "Stock mínimo" del header.
  const { data: stockMinimo = [] } = useQuery({
    queryKey: ["kardex-inventario-stock-minimo"],
    queryFn: () => getKardexInventarioStockMinimo(),
  });

  // Búsqueda por texto en el cliente (sobre el máximo de 500 filas del backend).
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return productos;
    return productos.filter(
      (p) =>
        p.descripcion.toLowerCase().includes(term) ||
        (p.marca ?? "").toLowerCase().includes(term) ||
        String(p.codigo).includes(term) ||
        (p.cod_barras ?? "").toLowerCase().includes(term)
    );
  }, [productos, search]);

  const totalStock = useMemo(
    () => filtered.reduce((acc, p) => acc + Number(p.stock ?? 0), 0),
    [filtered]
  );

  const sinStockCatalogo = useMemo(
    () => filtered.filter((p) => Number(p.stock ?? 0) <= 0).length,
    [filtered]
  );

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Inventario / Kardex
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span className="num">{productos.length} productos en catálogo</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="num">
              Stock total: {totalStock.toLocaleString("es-PE")}
            </span>
            {sinStockCatalogo > 0 && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-medium text-rose-600">
                  {sinStockCatalogo} sin stock
                </span>
              </>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as KardexTab)} className="space-y-4">
        <TabsList variant="line">
          <TabsTrigger value="catalogo">
            <Package className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="stock-minimo">
            <AlertTriangle className="h-4 w-4" />
            Stock mínimo
            {stockMinimo.length > 0 && (
              <Badge variant="warning" className="ml-1.5 h-5 px-1.5 text-[10px] tabular-nums">
                {stockMinimo.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="detalle">
            <FileText className="h-4 w-4" />
            Detalle Kardex
          </TabsTrigger>
          <TabsTrigger value="solicitudes">
            <Inbox className="h-4 w-4" />
            Solicitudes
          </TabsTrigger>
        </TabsList>

        {/* CATÁLOGO ─────────────────────────────────────────────── */}
        <TabsContent value="catalogo" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción, marca, código o barras…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={almacen || "all"} onValueChange={(v) => setAlmacen(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos los almacenes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los almacenes</SelectItem>
                {almacenes.map((a) => (
                  <SelectItem key={a.id_almacen} value={String(a.id_almacen)}>
                    {a.nom_almacen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stock} onValueChange={(v) => setStock(v)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Con stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo el stock</SelectItem>
                <SelectItem value="con_stock">Con stock</SelectItem>
                <SelectItem value="sin_stock">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border bg-card">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
                <h3 className="text-base font-semibold text-foreground">Sin resultados</h3>
                <p className="text-sm text-muted-foreground">
                  Ajusta los filtros o el término de búsqueda.
                </p>
              </div>
            ) : (
              <>
                <p className="num border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
                  {filtered.length} registros registrados
                </p>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead className="text-center">U.M.</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="pr-4 text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => {
                      const stockNum = Number(p.stock ?? 0);
                      const sinStock = stockNum <= 0;
                      return (
                        <TableRow key={p.codigo}>
                          <TableCell className="num pl-4 text-xs text-muted-foreground">
                            {p.codigo}
                          </TableCell>
                          <TableCell className="max-w-[22rem] truncate text-sm font-medium text-foreground">
                            {p.descripcion}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.marca || "—"}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {p.um || "NIU"}
                          </TableCell>
                          <TableCell className="num text-right text-sm text-foreground">
                            {money(p.precio)}
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <Badge
                              variant={
                                sinStock
                                  ? "destructive"
                                  : stockNum < 10
                                    ? "warning"
                                    : "success"
                              }
                              className={cn("num tabular-nums", sinStock && "opacity-90")}
                            >
                              {stockNum.toLocaleString("es-PE")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </TabsContent>

        {/* STOCK MÍNIMO ─────────────────────────────────────────── */}
        <TabsContent value="stock-minimo">
          <KardexStockMinimo />
        </TabsContent>

        {/* DETALLE KARDEX ───────────────────────────────────────── */}
        <TabsContent value="detalle">
          <KardexDetalle almacenFiltro={almacen} />
        </TabsContent>

        {/* SOLICITUDES ──────────────────────────────────────────── */}
        <TabsContent value="solicitudes">
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">Solicitudes de stock</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Próximamente: aquí podrás gestionar solicitudes de compra y reposición de stock
              generadas automáticamente cuando un producto caiga por debajo del mínimo.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

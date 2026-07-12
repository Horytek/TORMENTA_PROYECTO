import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, Filter, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { InventoryTable } from "../components/InventoryTable";
import { StockMinTable } from "../components/StockMinTable";
import { KardexDetalleTable } from "../components/KardexDetalleTable";
import {
  getProductos, getMarcas, getCategorias, getSubcategorias,
  getAlmacenes, getStockMinimo, getDetalleKardex,
} from "../api/kardex";
import type { InventarioFiltros } from "../types";

export default function InventoryPage() {
  const [filtros, setFiltros] = useState<InventarioFiltros>({ stock: "" });
  const [activeTab, setActiveTab] = useState("catalogo");

  // Detalle kardex params
  const [dkFechaInicio, setDkFechaInicio] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dkFechaFin, setDkFechaFin] = useState(() => new Date().toISOString().split("T")[0]);
  const [dkProducto, setDkProducto] = useState("");
  const [dkAlmacen, setDkAlmacen] = useState("");

  // Filtros dependientes
  const { data: marcas = [] } = useQuery({ queryKey: ["inventario-marcas"], queryFn: getMarcas });
  const { data: categorias = [] } = useQuery({ queryKey: ["inventario-categorias"], queryFn: getCategorias });
  const { data: subcategorias = [] } = useQuery({
    queryKey: ["inventario-subcategorias", filtros.cat],
    queryFn: () => getSubcategorias(filtros.cat ?? ""),
    enabled: !!filtros.cat,
  });
  const { data: almacenes = [] } = useQuery({ queryKey: ["inventario-almacenes"], queryFn: getAlmacenes });

  // Data queries
  const { data: productos = [], isLoading: loadingProductos, refetch: refetchProductos } = useQuery({
    queryKey: ["inventario-productos", filtros],
    queryFn: () => getProductos(filtros),
  });

  const { data: stockMin = [], isLoading: loadingStockMin } = useQuery({
    queryKey: ["inventario-stockmin"],
    queryFn: () => getStockMinimo(),
  });

  const dkParams = {
    fechaInicio: dkFechaInicio,
    fechaFin: dkFechaFin,
    idProducto: dkProducto ? Number(dkProducto) : undefined,
    idAlmacen: dkAlmacen ? Number(dkAlmacen) : undefined,
  };
  const { data: movimientos = [], isLoading: loadingMovimientos, refetch: refetchMovimientos } = useQuery({
    queryKey: ["inventario-kardex", dkParams],
    queryFn: () => getDetalleKardex(dkParams),
    enabled: activeTab === "kardex",
  });

  const update = (key: keyof InventarioFiltros, value: string) => {
    const next = { ...filtros, [key]: value };
    if (key !== "cat") setFiltros(next);
    else setFiltros({ ...next, subcat: "" });
  };

  const totalStock = productos.reduce((s, p) => s + Number(p.stock), 0);
  const sinStock = productos.filter(p => Number(p.stock) === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventario / Kardex</h1>
          <p className="text-sm text-muted-foreground">
            {productos.length} productos en catálogo &nbsp;·&nbsp;
            Stock total: {totalStock.toLocaleString()} &nbsp;·&nbsp;
            <span className="text-orange-600 dark:text-orange-400 font-medium">{sinStock} sin stock</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchProductos()}>
            <RefreshCw className="h-4 w-4 mr-1.5" />Actualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalogo"><Package className="h-4 w-4 mr-1.5" />Catálogo</TabsTrigger>
          <TabsTrigger value="stockmin">
            <AlertTriangle className="h-4 w-4 mr-1.5" />Stock mínimo
            {stockMin.length > 0 && (
              <Badge variant="destructive" className="ml-2">{stockMin.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="kardex"><Filter className="h-4 w-4 mr-1.5" />Detalle Kardex</TabsTrigger>
        </TabsList>

        {/* ── CATÁLOGO ─────────────────────────────────────────── */}
        <TabsContent value="catalogo" className="space-y-4">
          {/* Filters */}
          <Card className="p-4 border border-border bg-card shadow-sm">
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Buscar producto…"
                value={filtros.descripcion ?? ""}
                onChange={e => update("descripcion", e.target.value)}
                className="w-52 h-9"
              />
              <Select value={filtros.almacen ?? ""} onValueChange={v => update("almacen", v)}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Almacén" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los almacenes</SelectItem>
                  {almacenes.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.nom_almacen}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtros.marca ?? ""} onValueChange={v => update("marca", v)}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Marca" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {marcas.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nom_marca}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtros.cat ?? ""} onValueChange={v => update("cat", v)}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {categorias.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.categoria}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtros.subcat ?? ""} onValueChange={v => update("subcat", v)}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Subcategoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {subcategorias.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.sub_categoria}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtros.stock ?? ""} onValueChange={v => update("stock", v)}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Stock" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="con_stock">Con stock</SelectItem>
                  <SelectItem value="sin_stock">Sin stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Table */}
          {loadingProductos ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <InventoryTable productos={productos} />
          )}
        </TabsContent>

        {/* ── STOCK MÍNIMO ──────────────────────────────────────── */}
        <TabsContent value="stockmin">
          {loadingStockMin ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <StockMinTable productos={stockMin} />
          )}
        </TabsContent>

        {/* ── DETALLE KARDEX ────────────────────────────────────── */}
        <TabsContent value="kardex" className="space-y-4">
          <Card className="p-4 border border-border bg-card shadow-sm">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Fecha inicio</label>
                <Input type="date" value={dkFechaInicio} onChange={e => setDkFechaInicio(e.target.value)} className="h-9 w-40" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Fecha fin</label>
                <Input type="date" value={dkFechaFin} onChange={e => setDkFechaFin(e.target.value)} className="h-9 w-40" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Producto (ID)</label>
                <Input
                  type="number"
                  placeholder="Todos"
                  value={dkProducto}
                  onChange={e => setDkProducto(e.target.value)}
                  className="h-9 w-28"
                />
              </div>
              <Select value={dkAlmacen} onValueChange={setDkAlmacen}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Almacén" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {almacenes.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.nom_almacen}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => refetchMovimientos()} size="sm" className="h-9">
                <RefreshCw className="h-4 w-4 mr-1.5" />Buscar
              </Button>
            </div>
          </Card>

          {loadingMovimientos ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <KardexDetalleTable movimientos={movimientos} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, Filter, RefreshCw, ClipboardList, Plus, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useUserStore } from "@/store/useUserStore";
import { usePermissions } from "@/hooks/usePermissions";
import { InventoryTable } from "../components/InventoryTable";
import { StockMinTable } from "../components/StockMinTable";
import { HistoricoPanel } from "../components/HistoricoPanel";
import { LotesTable } from "../components/LotesTable";
import { LoteRequestDialog } from "../components/LoteRequestDialog";
import { LoteDetailDialog } from "../components/LoteDetailDialog";
import { VerificationConfigDialog } from "../components/VerificationConfigDialog";
import ViewVariantsModal from "@/features/products/components/ViewVariantsModal";
import {
  getProductos, getMarcas, getCategorias, getSubcategorias,
  getAlmacenes, getStockMinimo, getDetalleKardex, getDetalleKardexAnteriores, getInfProducto,
} from "../api/kardex";
import { verifyLote, approveLote } from "../api/lotes";
import type { InventarioFiltros, InventarioProducto, Lote } from "../types";

export default function InventoryPage() {
  const [filtros, setFiltros] = useState<InventarioFiltros>({ stock: "con_stock" });
  const [activeTab, setActiveTab] = useState("catalogo");
  const [variantsProduct, setVariantsProduct] = useState<InventarioProducto | null>(null);

  // Solicitudes de inventario (lotes)
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);
  const { can, isAdmin } = usePermissions();
  const [loteStage, setLoteStage] = useState<"verificar" | "aprobar">("verificar");
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);

  const verifyMutation = useMutation({
    mutationFn: (lote: Lote) => verifyLote(lote.id_lote, Number(user?.id)),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["lotes"] });
        setSelectedLote(null);
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ lote, almacenD }: { lote: Lote; almacenD: string }) =>
      approveLote(lote.id_lote, Number(user?.id), almacenD, `Ingreso Lote #${lote.id_lote}`),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["lotes"] });
        setSelectedLote(null);
      }
    },
  });

  const handleConfirmLote = (lote: Lote, almacenD?: string) => {
    if (loteStage === "verificar") {
      verifyMutation.mutate(lote);
    } else if (almacenD) {
      approveMutation.mutate({ lote, almacenD });
    }
  };

  // Detalle kardex params
  const [dkFechaInicio, setDkFechaInicio] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dkFechaFin, setDkFechaFin] = useState(() => new Date().toISOString().split("T")[0]);
  const [dkProducto, setDkProducto] = useState("");
  const [dkAlmacen, setDkAlmacen] = useState("");

  const handleSelectProductForKardex = (productoId: number) => {
    setDkProducto(String(productoId));
    setActiveTab("kardex");
  };

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
    idProducto: dkProducto && dkProducto !== "__all__" ? Number(dkProducto) : undefined,
    idAlmacen: dkAlmacen && dkAlmacen !== "__all__" ? Number(dkAlmacen) : undefined,
  };
  const { data: movimientos = [], isLoading: loadingMovimientos, refetch: refetchMovimientos } = useQuery({
    queryKey: ["inventario-kardex", dkParams],
    queryFn: () => getDetalleKardex(dkParams),
    enabled: activeTab === "kardex" && !!dkParams.idProducto,
  });
  const { data: kardexPrevio, refetch: refetchPrevio } = useQuery({
    queryKey: ["inventario-kardex-previo", dkParams],
    queryFn: () => getDetalleKardexAnteriores(dkParams),
    enabled: activeTab === "kardex" && !!dkParams.idProducto,
  });
  const { data: kardexProductoInfo, refetch: refetchProductoInfo } = useQuery({
    queryKey: ["inventario-kardex-producto", dkParams.idProducto, dkParams.idAlmacen],
    queryFn: () => getInfProducto({ idProducto: dkParams.idProducto, idAlmacen: dkParams.idAlmacen }),
    enabled: activeTab === "kardex" && !!dkParams.idProducto,
  });
  const canGenerateReports = can("almacen.generate");

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
          <TabsTrigger value="solicitudes"><ClipboardList className="h-4 w-4 mr-1.5" />Solicitudes</TabsTrigger>
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
            <InventoryTable
              productos={productos}
              onSelectKardex={(p) => handleSelectProductForKardex(p.codigo)}
              onSelectVariants={(p) => setVariantsProduct(p)}
            />
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
                <label className="text-xs text-muted-foreground">Producto</label>
                <Select value={dkProducto} onValueChange={setDkProducto}>
                  <SelectTrigger className="h-9 w-64 text-xs font-semibold bg-card border-border rounded-xl">
                    <SelectValue placeholder="Seleccione un producto..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="__all__" className="text-xs">Seleccione un producto...</SelectItem>
                    {productos.map(p => (
                      <SelectItem key={p.codigo} value={String(p.codigo)} className="text-xs font-medium">
                        {p.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={dkAlmacen} onValueChange={setDkAlmacen}>
                <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Almacén" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {almacenes.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.nom_almacen}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => { refetchMovimientos(); refetchPrevio(); refetchProductoInfo(); }} size="sm" className="h-9">
                <RefreshCw className="h-4 w-4 mr-1.5" />Buscar
              </Button>
            </div>
          </Card>

          {!dkParams.idProducto ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/50 py-20 text-center">
              <Filter className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">Seleccione un producto</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Elija un producto en los filtros de arriba (o haga clic en uno desde el Catálogo) para ver su histórico de movimientos.
              </p>
            </div>
          ) : loadingMovimientos ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <HistoricoPanel
              transacciones={movimientos}
              previo={kardexPrevio ?? null}
              productoInfo={kardexProductoInfo ?? null}
              fechaInicio={dkFechaInicio}
              fechaFin={dkFechaFin}
              canGeneratePdf={canGenerateReports}
            />
          )}
        </TabsContent>

        {/* ── SOLICITUDES DE INVENTARIO (LOTES) ─────────────────── */}
        <TabsContent value="solicitudes" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Tabs value={loteStage} onValueChange={(v) => { setLoteStage(v as "verificar" | "aprobar"); setSelectedLote(null); }}>
              <TabsList>
                <TabsTrigger value="verificar">Por Verificar (Paso 1)</TabsTrigger>
                <TabsTrigger value="aprobar">Por Aprobar (Paso 2)</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsConfigOpen(true)}>
                  <Settings className="h-4 w-4" /> Configurar roles
                </Button>
              )}
              <Button size="sm" className="gap-1.5" onClick={() => setIsRequestOpen(true)}>
                <Plus className="h-4 w-4" /> Nueva solicitud
              </Button>
            </div>
          </div>

          <Card className="border border-border bg-card p-4 shadow-sm">
            <LotesTable estado={loteStage === "verificar" ? 0 : 1} onAction={setSelectedLote} />
          </Card>
        </TabsContent>
      </Tabs>

      <LoteRequestDialog isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
      <LoteDetailDialog
        lote={selectedLote}
        isApproval={loteStage === "aprobar"}
        onClose={() => setSelectedLote(null)}
        onConfirm={handleConfirmLote}
        isPending={verifyMutation.isPending || approveMutation.isPending}
      />
      <VerificationConfigDialog isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <ViewVariantsModal
        isOpen={!!variantsProduct}
        onClose={() => setVariantsProduct(null)}
        productId={variantsProduct?.codigo ?? null}
        productName={variantsProduct?.descripcion ?? ""}
      />
    </div>
  );
}

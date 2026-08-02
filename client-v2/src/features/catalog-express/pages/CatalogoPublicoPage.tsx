import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Store,
  MapPin,
  PackageX,
  Search,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Tag,
  Layers,
  Sparkles,
  Check,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { getCatalogoPublico } from "../api/catalogoPublico";
import { construirEnlaceWhatsApp, formatearMensajePedido } from "../lib/whatsapp";
import { QuickViewModal } from "../components/QuickViewModal";
import type { CarritoItem, CatalogoProducto } from "../types";

const UMBRAL_POCAS_UNIDADES = 3;

type OrdenOption = "relevancia" | "precio-asc" | "precio-desc" | "nombre-asc" | "nombre-desc";

export default function CatalogoPublicoPage() {
  const { idTenant } = useParams<{ idTenant: string }>();

  // Estados de filtros y búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [marca, setMarca] = useState<string | null>(null);
  const [precioMin, setPrecioMin] = useState<string>("");
  const [precioMax, setPrecioMax] = useState<string>("");
  const [soloStock, setSoloStock] = useState<boolean>(false);
  const [orden, setOrden] = useState<OrdenOption>("relevancia");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(12);

  // Carrito y Modales
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [hoveredCodigo, setHoveredCodigo] = useState<number | null>(null);
  const [quickViewProducto, setQuickViewProducto] = useState<CatalogoProducto | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalogo-publico", idTenant],
    queryFn: () => getCatalogoPublico(idTenant!),
    enabled: !!idTenant,
  });

  // Reset de página al cambiar cualquier filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, categoria, marca, precioMin, precioMax, soloStock, orden, itemsPorPagina]);

  // Lista de categorías con contadores
  const categoriasConCount = useMemo(() => {
    const map = new Map<string, number>();
    (data?.productos ?? []).forEach((p) => {
      if (p.categoria) {
        map.set(p.categoria, (map.get(p.categoria) ?? 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data]);

  // Lista de marcas con contadores
  const marcasConCount = useMemo(() => {
    const map = new Map<string, number>();
    (data?.productos ?? []).forEach((p) => {
      if (p.nom_marca) {
        map.set(p.nom_marca, (map.get(p.nom_marca) ?? 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data]);

  // Productos filtrados
  const filtrados = useMemo(() => {
    let lista = data?.productos ?? [];

    if (categoria) {
      lista = lista.filter((p) => p.categoria === categoria);
    }
    if (marca) {
      lista = lista.filter((p) => p.nom_marca === marca);
    }
    if (soloStock) {
      lista = lista.filter((p) => p.stock > 0);
    }
    if (precioMin.trim() !== "") {
      const min = parseFloat(precioMin);
      if (!isNaN(min)) lista = lista.filter((p) => p.precio >= min);
    }
    if (precioMax.trim() !== "") {
      const max = parseFloat(precioMax);
      if (!isNaN(max)) lista = lista.filter((p) => p.precio <= max);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.descripcion.toLowerCase().includes(q) ||
          (p.nom_marca && p.nom_marca.toLowerCase().includes(q)) ||
          (p.categoria && p.categoria.toLowerCase().includes(q))
      );
    }
    return lista;
  }, [data, categoria, marca, soloStock, precioMin, precioMax, busqueda]);

  // Productos ordenados
  const ordenados = useMemo(() => {
    const copia = [...filtrados];
    switch (orden) {
      case "precio-asc":
        return copia.sort((a, b) => a.precio - b.precio);
      case "precio-desc":
        return copia.sort((a, b) => b.precio - a.precio);
      case "nombre-asc":
        return copia.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
      case "nombre-desc":
        return copia.sort((a, b) => b.descripcion.localeCompare(a.descripcion));
      case "relevancia":
      default:
        return copia;
    }
  }, [filtrados, orden]);

  // Paginación calculada
  const totalItems = ordenados.length;
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
  const paginaActualValida = Math.min(Math.max(1, paginaActual), totalPaginas);

  const paginados = useMemo(() => {
    const inicio = (paginaActualValida - 1) * itemsPorPagina;
    return ordenados.slice(inicio, inicio + itemsPorPagina);
  }, [ordenados, paginaActualValida, itemsPorPagina]);

  // Contadores y verificación de filtros activos
  const numFiltrosActivos = useMemo(() => {
    let count = 0;
    if (busqueda.trim()) count++;
    if (categoria !== null) count++;
    if (marca !== null) count++;
    if (precioMin.trim() !== "") count++;
    if (precioMax.trim() !== "") count++;
    if (soloStock) count++;
    if (orden !== "relevancia") count++;
    return count;
  }, [busqueda, categoria, marca, precioMin, precioMax, soloStock, orden]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoria(null);
    setMarca(null);
    setPrecioMin("");
    setPrecioMax("");
    setSoloStock(false);
    setOrden("relevancia");
    setPaginaActual(1);
  };

  // Carrito helpers
  const agregar = (producto: CatalogoProducto) => {
    setCarrito((prev) => {
      const existente = prev.find((it) => it.producto.codigo === producto.codigo);
      if (existente) {
        if (existente.cantidad >= producto.stock) return prev;
        return prev.map((it) => (it.producto.codigo === producto.codigo ? { ...it, cantidad: it.cantidad + 1 } : it));
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (codigo: number, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((it) =>
          it.producto.codigo === codigo ? { ...it, cantidad: Math.min(it.producto.stock, it.cantidad + delta) } : it
        )
        .filter((it) => it.cantidad > 0)
    );
  };

  const quitar = (codigo: number) => setCarrito((prev) => prev.filter((it) => it.producto.codigo !== codigo));

  const totalItemsCarrito = carrito.reduce((sum, it) => sum + it.cantidad, 0);
  const totalMontoCarrito = carrito.reduce((sum, it) => sum + it.producto.precio * it.cantidad, 0);

  const enlaceWhatsApp = data
    ? construirEnlaceWhatsApp(data.negocio.telefono, formatearMensajePedido(carrito, data.negocio.nombre))
    : null;

  const scrollToTop = () => {
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-4 text-center bg-background">
        <div className="rounded-full bg-muted p-4">
          <Store className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Catálogo no disponible</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          El enlace que abriste no corresponde a ningún catálogo activo o la tienda no está disponible temporalmente.
        </p>
      </div>
    );
  }

  // Componente de controles de filtros (reutilizado en Sidebar y Mobile Drawer)
  const FilterControls = () => (
    <div className="space-y-6">
      {/* Bloque Búsqueda */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buscar Producto</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, marca o categoría..."
            className="pl-9 pr-8"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bloque Disponibilidad */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-card shadow-xs">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Solo con stock</Label>
          <p className="text-[11px] text-muted-foreground">Ocultar agotados</p>
        </div>
        <Switch checked={soloStock} onCheckedChange={setSoloStock} />
      </div>

      {/* Bloque Categorías */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Categorías
          </Label>
          {categoria && (
            <button
              onClick={() => setCategoria(null)}
              className="text-[11px] font-medium text-brand hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="max-h-52 overflow-y-auto pr-1 space-y-1">
          <button
            onClick={() => setCategoria(null)}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
              categoria === null ? "bg-brand text-white font-semibold" : "hover:bg-muted text-foreground"
            }`}
          >
            <span>Todas las categorías</span>
            <Badge variant={categoria === null ? "outline" : "secondary"} className="text-[10px] px-1.5 py-0">
              {data.productos.length}
            </Badge>
          </button>
          {categoriasConCount.map((c) => (
            <button
              key={c.nombre}
              onClick={() => setCategoria((prev) => (prev === c.nombre ? null : c.nombre))}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
                categoria === c.nombre ? "bg-brand text-white font-semibold" : "hover:bg-muted text-foreground"
              }`}
            >
              <span className="truncate pr-2">{c.nombre}</span>
              <Badge
                variant={categoria === c.nombre ? "outline" : "secondary"}
                className={`text-[10px] px-1.5 py-0 ${categoria === c.nombre ? "border-white/50 text-white" : ""}`}
              >
                {c.count}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Bloque Marcas */}
      {marcasConCount.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Marcas
            </Label>
            {marca && (
              <button
                onClick={() => setMarca(null)}
                className="text-[11px] font-medium text-brand hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-1">
            <button
              onClick={() => setMarca(null)}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
                marca === null ? "bg-brand text-white font-semibold" : "hover:bg-muted text-foreground"
              }`}
            >
              <span>Todas las marcas</span>
              <Badge variant={marca === null ? "outline" : "secondary"} className="text-[10px] px-1.5 py-0">
                {data.productos.length}
              </Badge>
            </button>
            {marcasConCount.map((m) => (
              <button
                key={m.nombre}
                onClick={() => setMarca((prev) => (prev === m.nombre ? null : m.nombre))}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  marca === m.nombre ? "bg-brand text-white font-semibold" : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="truncate pr-2">{m.nombre}</span>
                <Badge
                  variant={marca === m.nombre ? "outline" : "secondary"}
                  className={`text-[10px] px-1.5 py-0 ${marca === m.nombre ? "border-white/50 text-white" : ""}`}
                >
                  {m.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bloque Rango de Precio */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rango de Precio (S/)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Mín"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              className="text-xs"
              min="0"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Máx"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              className="text-xs"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Botón reset general */}
      {numFiltrosActivos > 0 && (
        <Button variant="outline" size="sm" onClick={limpiarFiltros} className="w-full gap-2 text-xs">
          <RotateCcw className="h-3.5 w-3.5" /> Restablecer filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20 pb-28 text-foreground">
      {/* ─────────────────────────────────────────────────────────────
          HERO BANNER DEL NEGOCIO (Bloque Principal)
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-card border-b border-border bg-gradient-to-r from-background via-card to-background shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {data.negocio.logo ? (
                <img
                  src={data.negocio.logo}
                  alt={data.negocio.nombre}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-border shadow-md"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-2 ring-brand/20 shadow-md">
                  <Store className="h-8 w-8" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{data.negocio.nombre}</h1>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold gap-1">
                    <Sparkles className="h-3 w-3" /> Catálogo Oficial
                  </Badge>
                </div>
                {data.negocio.direccion && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" /> {data.negocio.direccion}
                  </p>
                )}
              </div>
            </div>

            {/* Badges y contacto rápido */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-3 bg-muted/60 px-3.5 py-2 rounded-xl text-xs font-medium border border-border/60">
                <div>
                  <span className="font-bold text-foreground">{data.productos.length}</span> Productos
                </div>
                <div className="h-3 w-px bg-border" />
                <div>
                  <span className="font-bold text-foreground">{categoriasConCount.length}</span> Categorías
                </div>
                {marcasConCount.length > 0 && (
                  <>
                    <div className="h-3 w-px bg-border" />
                    <div>
                      <span className="font-bold text-foreground">{marcasConCount.length}</span> Marcas
                    </div>
                  </>
                )}
              </div>

              {data.negocio.telefono && (
                <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                  <a href={`https://wa.me/${data.negocio.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 text-emerald-600" /> Consultar
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CONTENIDO PRINCIPAL EN 2 COLUMNAS (LAYOUT EXPANDIDO max-w-7xl)
         ───────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra superior de herramientas y ordenamiento (Móvil + Desktop) */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-xs">
          {/* Botón de filtros móvil */}
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros y Categorías
                  {numFiltrosActivos > 0 && (
                    <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                      {numFiltrosActivos}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-xs overflow-y-auto">
                <SheetHeader className="text-left pb-2">
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <SlidersHorizontal className="h-4 w-4" /> Filtros del Catálogo
                  </SheetTitle>
                </SheetHeader>
                <div className="pt-2">
                  <FilterControls />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Buscador rápido de cabecera */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar en el catálogo..."
              className="pl-9 pr-8 border-none bg-muted/40 focus-visible:bg-background transition-colors text-sm"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Opciones de Ordenamiento y Cantidad por Página */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={orden} onValueChange={(val) => setOrden(val as OrdenOption)}>
                <SelectTrigger className="h-9 text-xs w-[160px] bg-background">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevancia">Relevancia</SelectItem>
                  <SelectItem value="precio-asc">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="precio-desc">Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="nombre-asc">Nombre: A - Z</SelectItem>
                  <SelectItem value="nombre-desc">Nombre: Z - A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground hidden lg:inline">Mostrar:</span>
              <Select value={String(itemsPorPagina)} onValueChange={(val) => setItemsPorPagina(Number(val))}>
                <SelectTrigger className="h-9 text-xs w-[75px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Chips de Filtros Activos */}
        {numFiltrosActivos > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 bg-card/60 p-3 rounded-xl border border-border/60">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 pr-1">
              <SlidersHorizontal className="h-3 w-3" /> Filtros aplicados:
            </span>
            {busqueda.trim() && (
              <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                Búsqueda: "{busqueda}"
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setBusqueda("")} />
              </Badge>
            )}
            {categoria && (
              <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                Categoría: {categoria}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setCategoria(null)} />
              </Badge>
            )}
            {marca && (
              <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                Marca: {marca}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setMarca(null)} />
              </Badge>
            )}
            {precioMin.trim() !== "" && (
              <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                Min: S/ {precioMin}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setPrecioMin("")} />
              </Badge>
            )}
            {precioMax.trim() !== "" && (
              <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                Max: S/ {precioMax}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setPrecioMax("")} />
              </Badge>
            )}
            {soloStock && (
              <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                Con Stock
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setSoloStock(false)} />
              </Badge>
            )}
            {orden !== "relevancia" && (
              <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                Ordenado
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setOrden("relevancia")} />
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={limpiarFiltros}
              className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
            >
              Limpiar todo
            </Button>
          </div>
        )}

        <div className="flex gap-8 items-start">
          {/* ─────────────────────────────────────────────────────────────
              COLUMNA IZQUIERDA: SIDEBAR DE FILTROS (Desktop)
             ───────────────────────────────────────────────────────────── */}
          <aside className="hidden md:block w-64 lg:w-72 shrink-0 bg-card p-5 rounded-2xl border border-border shadow-xs sticky top-4">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h2 className="font-bold text-sm tracking-tight flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-brand" /> Filtros
              </h2>
              {numFiltrosActivos > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {numFiltrosActivos} activo{numFiltrosActivos > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <FilterControls />
          </aside>

          {/* ─────────────────────────────────────────────────────────────
              COLUMNA DERECHA: GRILLA DE PRODUCTOS + PAGINACIÓN
             ───────────────────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Resumen de cantidad mostrada */}
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Mostrando{" "}
                <strong className="font-semibold text-foreground">
                  {totalItems > 0 ? (paginaActualValida - 1) * itemsPorPagina + 1 : 0}
                </strong>{" "}
                -{" "}
                <strong className="font-semibold text-foreground">
                  {Math.min(paginaActualValida * itemsPorPagina, totalItems)}
                </strong>{" "}
                de <strong className="font-semibold text-foreground">{totalItems}</strong> productos
              </span>

              {totalPaginas > 1 && (
                <span>
                  Página <strong className="font-semibold text-foreground">{paginaActualValida}</strong> de{" "}
                  <strong className="font-semibold text-foreground">{totalPaginas}</strong>
                </span>
              )}
            </div>

            {/* Grilla de Productos */}
            {paginados.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-20 text-center px-4">
                <div className="rounded-full bg-muted p-4">
                  <PackageX className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-base">No encontramos productos</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Prueba cambiando el término de búsqueda o ajustando los filtros seleccionados.
                </p>
                {numFiltrosActivos > 0 && (
                  <Button variant="outline" size="sm" onClick={limpiarFiltros} className="mt-2 text-xs">
                    Restablecer filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginados.map((p) => {
                  const enCarrito = carrito.find((it) => it.producto.codigo === p.codigo)?.cantidad ?? 0;
                  const imagenPrincipal = p.images?.[0] ?? p.imagen_url;
                  const imagenHover = p.images?.[1];
                  const mostrarHover = hoveredCodigo === p.codigo && imagenHover;

                  return (
                    <div
                      key={p.codigo}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-md hover:border-border/80"
                      onMouseEnter={() => setHoveredCodigo(p.codigo)}
                      onMouseLeave={() => setHoveredCodigo(null)}
                    >
                      {/* Imagen con badge */}
                      <button
                        type="button"
                        onClick={() => setQuickViewProducto(p)}
                        className="relative aspect-square bg-muted/40 overflow-hidden cursor-pointer w-full text-left"
                      >
                        {imagenPrincipal ? (
                          <img
                            src={mostrarHover ? imagenHover : imagenPrincipal}
                            alt={p.descripcion}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground/30">
                            <Store className="h-10 w-10" />
                          </div>
                        )}

                        {/* Badges de estado */}
                        <div className="absolute left-2 top-2 flex flex-col gap-1">
                          {p.stock === 0 ? (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                              Agotado
                            </Badge>
                          ) : p.stock <= UMBRAL_POCAS_UNIDADES ? (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0.5 font-semibold">
                              Pocas unidades
                            </Badge>
                          ) : null}
                        </div>

                        {/* Tag de Categoría flotante */}
                        {p.categoria && (
                          <span className="absolute right-2 bottom-2 text-[9px] font-medium bg-black/60 text-white backdrop-blur-md px-2 py-0.5 rounded-md max-w-[80%] truncate">
                            {p.categoria}
                          </span>
                        )}
                      </button>

                      {/* Información del producto */}
                      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                        {p.nom_marca && (
                          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {p.nom_marca}
                          </p>
                        )}
                        <h3 className="line-clamp-2 text-xs font-semibold text-foreground group-hover:text-brand transition-colors leading-snug">
                          {p.descripcion}
                        </h3>

                        <div className="mt-auto pt-2 flex items-baseline justify-between gap-1 border-t border-border/40">
                          <span className="text-sm sm:text-base font-bold text-brand">
                            S/ {p.precio.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Stock: {p.stock}
                          </span>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-1.5 pt-1">
                          <Button
                            size="sm"
                            className="h-8 flex-1 text-xs gap-1 font-medium"
                            disabled={p.stock === 0 || enCarrito >= p.stock}
                            onClick={() => agregar(p)}
                          >
                            {enCarrito > 0 ? (
                              <>
                                <Check className="h-3.5 w-3.5" /> ({enCarrito})
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" /> Agregar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs"
                            onClick={() => setQuickViewProducto(p)}
                          >
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                PAGINACIÓN INTERACTIVA
               ───────────────────────────────────────────────────────────── */}
            {totalPaginas > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-xs">
                <div className="text-xs text-muted-foreground">
                  Página <strong className="text-foreground font-semibold">{paginaActualValida}</strong> de{" "}
                  <strong className="text-foreground font-semibold">{totalPaginas}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Primera página */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setPaginaActual(1);
                      scrollToTop();
                    }}
                    disabled={paginaActualValida === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  {/* Página anterior */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setPaginaActual((prev) => Math.max(1, prev - 1));
                      scrollToTop();
                    }}
                    disabled={paginaActualValida === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Números de página */}
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                      .filter((p) => {
                        // Mostrar siempre primera, última y cercanas a la actual
                        return (
                          p === 1 ||
                          p === totalPaginas ||
                          Math.abs(p - paginaActualValida) <= 1
                        );
                      })
                      .map((p, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && p - prevPage > 1;

                        return (
                          <div key={p} className="flex items-center gap-1">
                            {showEllipsis && (
                              <span className="px-1 text-xs text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={paginaActualValida === p ? "default" : "outline"}
                              size="sm"
                              className="h-8 w-8 p-0 text-xs font-semibold"
                              onClick={() => {
                                setPaginaActual(p);
                                scrollToTop();
                              }}
                            >
                              {p}
                            </Button>
                          </div>
                        );
                      })}
                  </div>

                  {/* Página siguiente */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setPaginaActual((prev) => Math.min(totalPaginas, prev + 1));
                      scrollToTop();
                    }}
                    disabled={paginaActualValida === totalPaginas}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Última página */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setPaginaActual(totalPaginas);
                      scrollToTop();
                    }}
                    disabled={paginaActualValida === totalPaginas}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTÓN FLOTANTE DEL CARRITO
         ───────────────────────────────────────────────────────────── */}
      {totalItemsCarrito > 0 && (
        <button
          onClick={() => setCarritoAbierto(true)}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-xl hover:bg-brand/90 transition-transform active:scale-95"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>
            {totalItemsCarrito} producto{totalItemsCarrito === 1 ? "" : "s"}
          </span>
          <span className="h-4 w-px bg-white/30" />
          <span className="font-bold">S/ {totalMontoCarrito.toFixed(2)}</span>
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE PEDIDO / CARRITO
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={carritoAbierto} onOpenChange={setCarritoAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-brand" /> Tu Pedido
            </DialogTitle>
          </DialogHeader>

          {carrito.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tu carrito está vacío.</p>
          ) : (
            <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {carrito.map((it) => (
                <div key={it.producto.codigo} className="flex items-center gap-3 rounded-xl border border-border p-2.5 bg-card">
                  <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {it.producto.images?.[0] || it.producto.imagen_url ? (
                      <img
                        src={it.producto.images?.[0] ?? it.producto.imagen_url ?? ""}
                        alt={it.producto.descripcion}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Store className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{it.producto.descripcion}</p>
                    <p className="text-[11px] font-bold text-brand">S/ {it.producto.precio.toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => cambiarCantidad(it.producto.codigo, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-xs font-bold">{it.cantidad}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => cambiarCantidad(it.producto.codigo, 1)}
                      disabled={it.cantidad >= it.producto.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => quitar(it.producto.codigo)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-bold">
                <span>Total Estimado</span>
                <Badge variant="secondary" className="text-base px-3 py-1 font-bold text-brand">
                  S/ {totalMontoCarrito.toFixed(2)}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col pt-2">
            {enlaceWhatsApp ? (
              <Button
                asChild
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
                disabled={carrito.length === 0}
              >
                <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" /> Enviar pedido por WhatsApp
                </a>
              </Button>
            ) : (
              <p className="text-center text-xs text-destructive">
                Esta tienda no tiene configurado un número de WhatsApp todavía.
              </p>
            )}
            <Button variant="ghost" className="w-full text-xs" onClick={() => setCarritoAbierto(false)}>
              Seguir viendo el catálogo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QuickView Modal */}
      <QuickViewModal
        producto={quickViewProducto}
        nombreNegocio={data.negocio.nombre}
        telefono={data.negocio.telefono}
        onClose={() => setQuickViewProducto(null)}
      />
    </div>
  );
}


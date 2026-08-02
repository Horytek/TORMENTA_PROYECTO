import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, Trash2, MessageCircle, Store, MapPin, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getCatalogoPublico } from "../api/catalogoPublico";
import { construirEnlaceWhatsApp, formatearMensajePedido } from "../lib/whatsapp";
import { QuickViewModal } from "../components/QuickViewModal";
import type { CarritoItem, CatalogoProducto } from "../types";

const UMBRAL_POCAS_UNIDADES = 3;

// ─────────────────────────────────────────────────────────────────
// CatalogoPublicoPage — Vitrina pública sin login. Carrito solo en
// memoria del navegador (no se persiste nada en el servidor); el
// "checkout" es un mensaje de WhatsApp armado con el pedido.
// ─────────────────────────────────────────────────────────────────

export default function CatalogoPublicoPage() {
  const { idTenant } = useParams<{ idTenant: string }>();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [hoveredCodigo, setHoveredCodigo] = useState<number | null>(null);
  const [quickViewProducto, setQuickViewProducto] = useState<CatalogoProducto | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalogo-publico", idTenant],
    queryFn: () => getCatalogoPublico(idTenant!),
    enabled: !!idTenant,
  });

  const categorias = useMemo(
    () => Array.from(new Set((data?.productos ?? []).map((p) => p.categoria).filter((c): c is string => !!c))).sort(),
    [data]
  );

  const filtrados = useMemo(() => {
    let lista = data?.productos ?? [];
    if (categoria) lista = lista.filter((p) => p.categoria === categoria);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter((p) => p.descripcion.toLowerCase().includes(q) || p.nom_marca?.toLowerCase().includes(q));
    }
    return lista;
  }, [data, categoria, busqueda]);

  const agregar = (producto: CatalogoProducto) => {
    setCarrito((prev) => {
      const existente = prev.find((it) => it.producto.codigo === producto.codigo);
      if (existente) {
        if (existente.cantidad >= producto.stock) return prev;
        return prev.map((it) => it.producto.codigo === producto.codigo ? { ...it, cantidad: it.cantidad + 1 } : it);
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (codigo: number, delta: number) => {
    setCarrito((prev) => prev
      .map((it) => it.producto.codigo === codigo ? { ...it, cantidad: Math.min(it.producto.stock, it.cantidad + delta) } : it)
      .filter((it) => it.cantidad > 0));
  };

  const quitar = (codigo: number) => setCarrito((prev) => prev.filter((it) => it.producto.codigo !== codigo));

  const totalItems = carrito.reduce((sum, it) => sum + it.cantidad, 0);
  const totalMonto = carrito.reduce((sum, it) => sum + it.producto.precio * it.cantidad, 0);

  const enlaceWhatsApp = data
    ? construirEnlaceWhatsApp(data.negocio.telefono, formatearMensajePedido(carrito, data.negocio.nombre))
    : null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <Store className="h-10 w-10 text-muted-foreground/40" />
        <h1 className="text-lg font-semibold">Catálogo no disponible</h1>
        <p className="text-sm text-muted-foreground">El enlace que abriste no corresponde a ningún catálogo activo.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Header del negocio */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {data.negocio.logo ? (
            <img src={data.negocio.logo} alt={data.negocio.nombre} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Store className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground">{data.negocio.nombre}</h1>
            {data.negocio.direccion && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" /> {data.negocio.direccion}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-4 space-y-3">
        <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto…" />

        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoria(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${categoria === null ? "bg-brand text-white border-brand" : "border-border text-muted-foreground"}`}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria((prev) => (prev === c ? null : c))}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${categoria === c ? "bg-brand text-white border-brand" : "border-border text-muted-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <PackageX className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay productos disponibles{busqueda ? ` para "${busqueda}"` : ""}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtrados.map((p) => {
              const enCarrito = carrito.find((it) => it.producto.codigo === p.codigo)?.cantidad ?? 0;
              const imagenPrincipal = p.images?.[0] ?? p.imagen_url;
              const imagenHover = p.images?.[1];
              const mostrarHover = hoveredCodigo === p.codigo && imagenHover;
              return (
                <div
                  key={p.codigo}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                  onMouseEnter={() => setHoveredCodigo(p.codigo)}
                  onMouseLeave={() => setHoveredCodigo(null)}
                >
                  <button
                    type="button"
                    onClick={() => setQuickViewProducto(p)}
                    className="relative aspect-square bg-muted cursor-pointer"
                  >
                    {imagenPrincipal ? (
                      <img
                        src={mostrarHover ? imagenHover : imagenPrincipal}
                        alt={p.descripcion}
                        className="h-full w-full object-cover transition-opacity"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/30"><Store className="h-8 w-8" /></div>
                    )}
                    {p.stock > 0 && p.stock <= UMBRAL_POCAS_UNIDADES && (
                      <Badge variant="secondary" className="absolute left-1.5 top-1.5 text-[10px]">Pocas unidades</Badge>
                    )}
                  </button>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium text-foreground">{p.descripcion}</p>
                    {p.nom_marca && <p className="text-[10px] text-muted-foreground">{p.nom_marca}</p>}
                    <p className="mt-auto text-sm font-bold text-brand">S/ {p.precio.toFixed(2)}</p>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        disabled={enCarrito >= p.stock}
                        onClick={() => agregar(p)}
                      >
                        {enCarrito > 0 ? `En carrito (${enCarrito})` : "Agregar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
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
      </div>

      {/* Botón flotante del carrito */}
      {totalItems > 0 && (
        <button
          onClick={() => setCarritoAbierto(true)}
          className="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <ShoppingCart className="h-4 w-4" />
          {totalItems} producto{totalItems === 1 ? "" : "s"} — S/ {totalMonto.toFixed(2)}
        </button>
      )}

      {/* Carrito */}
      <Dialog open={carritoAbierto} onOpenChange={setCarritoAbierto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tu pedido</DialogTitle>
          </DialogHeader>

          {carrito.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Tu carrito está vacío.</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {carrito.map((it) => (
                <div key={it.producto.codigo} className="flex items-center gap-2 rounded-lg border border-border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{it.producto.descripcion}</p>
                    <p className="text-[11px] text-muted-foreground">S/ {it.producto.precio.toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => cambiarCantidad(it.producto.codigo, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-xs font-medium">{it.cantidad}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => cambiarCantidad(it.producto.codigo, 1)} disabled={it.cantidad >= it.producto.stock}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => quitar(it.producto.codigo)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total</span>
                <Badge variant="secondary" className="num text-sm">S/ {totalMonto.toFixed(2)}</Badge>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {enlaceWhatsApp ? (
              <Button asChild className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={carrito.length === 0}>
                <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Enviar pedido por WhatsApp
                </a>
              </Button>
            ) : (
              <p className="text-center text-xs text-destructive">Esta tienda no tiene un teléfono de WhatsApp configurado todavía.</p>
            )}
            <Button variant="ghost" className="w-full" onClick={() => setCarritoAbierto(false)}>Seguir viendo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickViewModal
        producto={quickViewProducto}
        nombreNegocio={data.negocio.nombre}
        telefono={data.negocio.telefono}
        onClose={() => setQuickViewProducto(null)}
      />
    </div>
  );
}

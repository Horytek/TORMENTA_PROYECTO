// ─────────────────────────────────────────────────────────────────
// Wizard guiado de devolución (5 pasos):
// 1 Buscar venta → 2 Productos y cantidades → 3 Motivos y condición →
// 4 Resolución → 5 Revisión y confirmación.
// Toda la matemática/validación vive en lib/rules.ts (puro); acá solo UI.
// ─────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertTriangle, Info, Minus, Plus, ArrowLeftRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getVentas, getVentaById, getProductosVentas } from "@/features/sales/api/ventas";
import type { Venta, VentaDetalle, POSProduct } from "@/features/sales/types";
import { useDevolucionesPrevias, useCrearDevolucion } from "../hooks/useDevoluciones";
import type {
  CanalVenta, CondicionProducto, DevolucionItem, DevolucionPayload,
  MotivoDevolucion, TipoResolucion,
} from "../types";
import {
  cantidadDisponible, destinoSugerido, devueltoPrevio, diferenciaCambio,
  estadoInicial, evaluarDevolucion, importeItem, totalDevolucion,
} from "../lib/rules";
import {
  CANAL_LABELS, CONDICION_LABELS, DESTINO_LABELS, MOTIVO_LABELS,
  POLITICA_DEFAULT, RESOLUCION_LABELS, soles,
} from "../config/catalog";

const PASOS = ["Venta", "Productos", "Motivos", "Resolución", "Confirmar"] as const;

interface ItemDraft {
  cantidad: number;
  motivo: MotivoDevolucion;
  motivo_detalle?: string;
  condicion: CondicionProducto;
  destino: DevolucionItem["destino"];
}

const DRAFT_DEFAULT: Omit<ItemDraft, "cantidad"> = {
  motivo: "producto_defectuoso",
  condicion: "nuevo",
  destino: "stock_disponible",
};

export function ReturnWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [paso, setPaso] = useState(0);
  const [q, setQ] = useState("");
  const [venta, setVenta] = useState<Venta | null>(null);
  const [drafts, setDrafts] = useState<Record<number, ItemDraft>>({});
  const [resolucion, setResolucion] = useState<TipoResolucion | null>(null);
  const [canal, setCanal] = useState<CanalVenta>("tienda");
  const [observaciones, setObservaciones] = useState("");
  const [evidencias, setEvidencias] = useState("");
  const [cambio, setCambio] = useState<{ producto: POSProduct; cantidad: number } | null>(null);
  const [qProducto, setQProducto] = useState("");

  const crear = useCrearDevolucion();

  // ── Paso 1: búsqueda de la venta original ──────────────────────
  const { data: ventas = [], isLoading: loadingVentas } = useQuery({
    queryKey: ["ventas", "para-devolucion"],
    queryFn: () => getVentas(),
    enabled: open && paso === 0,
  });
  const ventasFiltradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ventas
      .filter((v) => v.estado_venta !== 0)
      .filter((v) =>
        !term ||
        [v.num_comprobante, v.nom_cliente, v.documento_cliente, v.f_venta, v.nombre_sucursal, v.nom_usuario]
          .some((c) => c && String(c).toLowerCase().includes(term))
      )
      .slice(0, 20);
  }, [ventas, q]);

  // ── Detalle de la venta + devoluciones previas ────────────────
  const idVenta = venta?.id_venta ?? null;
  const { data: ventaDetalle } = useQuery({
    queryKey: ["venta-detalle", idVenta],
    queryFn: () => getVentaById(idVenta as number),
    enabled: idVenta != null,
  });
  const { data: previas = [] } = useDevolucionesPrevias(idVenta);

  const detalles: (VentaDetalle & { disponible: number; devuelto: number })[] = useMemo(() => {
    const lista = ventaDetalle?.detalles ?? venta?.detalles ?? [];
    return lista.map((d) => {
      const devuelto = devueltoPrevio(d.id_detalle, previas);
      return {
        ...d,
        devuelto,
        disponible: cantidadDisponible({ cantidad_vendida: d.cantidad, cantidad_devuelta_previa: devuelto }),
      };
    });
  }, [ventaDetalle, venta, previas]);

  // ── Items resultantes (drafts → DevolucionItem[]) ─────────────
  const items: DevolucionItem[] = useMemo(() => {
    return detalles
      .filter((d) => (drafts[d.id_detalle]?.cantidad ?? 0) > 0)
      .map((d) => {
        const draft = drafts[d.id_detalle] ?? { cantidad: 0, ...DRAFT_DEFAULT };
        const base: DevolucionItem = {
          id_detalle: d.id_detalle,
          id_producto: d.id_producto,
          descripcion: d.descripcion || d.nombre_producto || d.nombre || `Producto ${d.id_producto}`,
          sku: d.sku,
          nom_talla: d.nom_talla,
          nom_tonalidad: d.nom_tonalidad,
          cantidad_vendida: d.cantidad,
          cantidad_devuelta_previa: d.devuelto,
          cantidad: draft.cantidad,
          precio_unitario: d.precio_unitario,
          importe: importeItem(draft.cantidad, d.precio_unitario),
          motivo: draft.motivo,
          motivo_detalle: draft.motivo_detalle,
          condicion: draft.condicion,
          destino: draft.destino,
        };
        if (resolucion === "cambio_producto" && cambio) {
          base.producto_cambio = {
            id_producto: cambio.producto.codigo,
            descripcion: cambio.producto.nombre,
            precio_unitario: cambio.producto.precio,
            cantidad: cambio.cantidad,
          };
        }
        return base;
      });
  }, [detalles, drafts, resolucion, cambio]);

  const total = totalDevolucion(items);
  const diferencia = diferenciaCambio(items);
  const evaluacion = useMemo(
    () => evaluarDevolucion({ fecha_venta: venta?.f_venta ?? "", items, politica: POLITICA_DEFAULT, canal }),
    [venta, items, canal]
  );

  // ── Paso 4: catálogo para cambio de producto ──────────────────
  const { data: catalogo = [] } = useQuery({
    queryKey: ["productos-cambio"],
    queryFn: () => getProductosVentas(),
    enabled: open && paso === 3 && resolucion === "cambio_producto",
  });
  const catalogoFiltrado = useMemo(() => {
    const term = qProducto.trim().toLowerCase();
    return catalogo.filter((p) => !term || p.nombre.toLowerCase().includes(term)).slice(0, 8);
  }, [catalogo, qProducto]);

  // ── Navegación ────────────────────────────────────────────────
  const puedeAvanzar = (): boolean => {
    switch (paso) {
      case 0: return venta != null;
      case 1: return items.length > 0 && items.every((i) => i.cantidad <= cantidadDisponible(i));
      case 2: return items.every((i) => i.motivo !== "otro" || !!i.motivo_detalle?.trim());
      case 3: return resolucion != null && (resolucion !== "cambio_producto" || cambio != null);
      case 4: return evaluacion.permitida && !crear.isPending;
      default: return false;
    }
  };

  const reset = () => {
    setPaso(0); setQ(""); setVenta(null); setDrafts({}); setResolucion(null);
    setCanal("tienda"); setObservaciones(""); setEvidencias(""); setCambio(null); setQProducto("");
  };

  const confirmar = () => {
    if (!venta || !resolucion) return;
    const payload: DevolucionPayload = {
      id_venta: venta.id_venta as number,
      num_comprobante: venta.num_comprobante,
      tipo_comprobante: venta.id_comprobante,
      nom_cliente: venta.nom_cliente,
      id_sucursal: venta.id_sucursal,
      nombre_sucursal: venta.nombre_sucursal,
      canal,
      fecha: new Date().toISOString(),
      estado: estadoInicial(evaluacion),
      resolucion,
      items,
      total,
      diferencia_cambio: resolucion === "cambio_producto" ? diferencia : undefined,
      observaciones: observaciones.trim() || undefined,
      evidencias: evidencias.trim() ? evidencias.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    };
    crear.mutate(payload, { onSuccess: () => { reset(); onClose(); } });
  };

  const setDraft = (id: number, patch: Partial<ItemDraft>) =>
    setDrafts((prev) => {
      const current = prev[id] ?? { cantidad: 0, ...DRAFT_DEFAULT };
      return { ...prev, [id]: { ...current, ...patch } };
    });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva devolución</DialogTitle>
        </DialogHeader>

        {/* ── Línea de progreso ── */}
        <div className="flex items-center gap-1.5 mb-4 select-none">
          {PASOS.map((p, i) => (
            <div key={p} className="flex items-center gap-1.5 flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => i < paso && setPaso(i)}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 transition-colors",
                  i === paso ? "bg-primary/15 text-primary"
                    : i < paso ? "text-foreground/70 hover:bg-muted cursor-pointer"
                    : "text-muted-foreground/50"
                )}
              >
                <span className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[9px]",
                  i < paso ? "bg-primary text-primary-foreground" : i === paso ? "border border-primary text-primary" : "border border-border"
                )}>
                  {i < paso ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </span>
                {p}
              </button>
              {i < PASOS.length - 1 && <div className={cn("h-px flex-1", i < paso ? "bg-primary/50" : "bg-border/60")} />}
            </div>
          ))}
        </div>

        {/* ── Paso 1: buscar y elegir la venta ── */}
        {paso === 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="N° de comprobante, cliente, documento, fecha, vendedor o escaneo…"
                className="pl-10 h-9 text-sm rounded-xl"
              />
            </div>
            <div className="rounded-xl border border-border divide-y divide-border/40 overflow-hidden">
              {loadingVentas && <p className="p-4 text-xs text-muted-foreground">Buscando ventas…</p>}
              {!loadingVentas && ventasFiltradas.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground">Sin ventas que coincidan.</p>
              )}
              {ventasFiltradas.map((v) => (
                <button
                  key={v.id_venta} type="button"
                  onClick={() => { setVenta(v); setPaso(1); }}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors cursor-pointer",
                    venta?.id_venta === v.id_venta && "bg-primary/10"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{v.num_comprobante || `Venta #${v.id_venta}`}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {v.nom_cliente || "Cliente general"} · {v.f_venta} · {v.nombre_sucursal || "—"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold num shrink-0">{soles(v.total_t)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Paso 2: productos y cantidades ── */}
        {paso === 1 && (
          <div className="space-y-2">
            {detalles.length === 0 && (
              <p className="text-xs text-muted-foreground p-4">Cargando productos de la venta…</p>
            )}
            {detalles.map((d) => {
              const draft = drafts[d.id_detalle];
              const cantidad = draft?.cantidad ?? 0;
              const agotado = d.disponible === 0;
              return (
                <div
                  key={d.id_detalle}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3",
                    agotado ? "border-border/40 opacity-50" : cantidad > 0 ? "border-primary/50 bg-primary/5" : "border-border"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{d.descripcion || d.nombre_producto || d.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {[d.sku, d.nom_talla, d.nom_tonalidad].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      Vendidas {d.cantidad} · Devueltas {d.devuelto} ·{" "}
                      <span className={agotado ? "text-destructive" : "text-foreground/80 font-medium"}>
                        {agotado ? "Ya devuelto por completo" : `${d.disponible} disponibles`}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs num text-muted-foreground shrink-0">{soles(d.precio_unitario)} c/u</span>
                  {!agotado && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg"
                        onClick={() => setDraft(d.id_detalle, { cantidad: Math.max(0, cantidad - 1) })}
                        disabled={cantidad === 0} aria-label="Menos">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold num">{cantidad}</span>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg"
                        onClick={() => setDraft(d.id_detalle, { cantidad: Math.min(d.disponible, cantidad + 1) })}
                        disabled={cantidad >= d.disponible} aria-label="Más">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {items.length > 0 && (
              <p className="text-xs text-muted-foreground text-right pt-1">
                {items.length} producto(s) seleccionados · <span className="font-semibold text-foreground">{soles(total)}</span>
              </p>
            )}
          </div>
        )}

        {/* ── Paso 3: motivos, condición y destino ── */}
        {paso === 2 && (
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.id_detalle} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{i.descripcion}</p>
                  <Badge variant="secondary" className="shrink-0">{i.cantidad} und.</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select value={i.motivo} onValueChange={(v) => setDraft(i.id_detalle, { motivo: v as MotivoDevolucion })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Motivo" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MOTIVO_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={i.condicion} onValueChange={(v) => setDraft(i.id_detalle, {
                    condicion: v as CondicionProducto,
                    destino: destinoSugerido(v as CondicionProducto, POLITICA_DEFAULT),
                  })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Estado físico" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONDICION_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={i.destino} onValueChange={(v) => setDraft(i.id_detalle, { destino: v as DevolucionItem["destino"] })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Destino de inventario" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DESTINO_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {i.motivo === "otro" && (
                  <Input
                    value={i.motivo_detalle ?? ""} placeholder="Describe el motivo…"
                    onChange={(e) => setDraft(i.id_detalle, { motivo_detalle: e.target.value })}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select value={canal} onValueChange={(v) => setCanal(v as CanalVenta)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Canal de la venta" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CANAL_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                value={evidencias} onChange={(e) => setEvidencias(e.target.value)}
                placeholder="Evidencias: URLs separadas por coma (opcional)"
                className="h-8 text-xs"
              />
            </div>
            <Textarea
              value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones (opcional)…" className="text-xs min-h-16"
            />
            {evaluacion.requiere_evidencia && !evidencias.trim() && (
              <p className="flex items-center gap-1.5 text-[11px] text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Alguno de los motivos elegidos requiere evidencia según la política.
              </p>
            )}
          </div>
        )}

        {/* ── Paso 4: resolución ── */}
        {paso === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.entries(RESOLUCION_LABELS) as [TipoResolucion, string][])
                .filter(([v]) => v !== "rechazo")
                .map(([v, l]) => (
                  <button
                    key={v} type="button" onClick={() => setResolucion(v)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm transition-colors cursor-pointer",
                      resolucion === v ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-muted/50 text-foreground/80"
                    )}
                  >
                    {l}
                  </button>
                ))}
            </div>

            {resolucion === "cambio_producto" && (
              <div className="rounded-xl border border-border p-4 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" />Producto de reemplazo
                </p>
                {cambio ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{cambio.producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">{soles(cambio.producto.precio)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" min={1} value={cambio.cantidad}
                        onChange={(e) => setCambio({ ...cambio, cantidad: Math.max(1, Number(e.target.value)) })}
                        className="h-8 w-16 text-xs text-center"
                      />
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCambio(null)}>Cambiar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Input
                      value={qProducto} onChange={(e) => setQProducto(e.target.value)}
                      placeholder="Buscar producto…" className="h-8 text-xs"
                    />
                    <div className="divide-y divide-border/40 rounded-lg border border-border/60">
                      {catalogoFiltrado.map((p) => (
                        <button key={p.codigo} type="button"
                          onClick={() => setCambio({ producto: p, cantidad: 1 })}
                          className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-muted/50 cursor-pointer">
                          <span className="truncate">{p.nombre}</span>
                          <span className="num shrink-0">{soles(p.precio)}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {cambio && (
                  <p className={cn("text-xs pt-1", diferencia > 0 ? "text-warning" : diferencia < 0 ? "text-success" : "text-muted-foreground")}>
                    {diferencia > 0
                      ? `El cliente debe pagar ${soles(diferencia)} adicionales.`
                      : diferencia < 0
                        ? `El cliente recibe ${soles(Math.abs(diferencia))} de saldo a favor.`
                        : "Cambio sin diferencia de precio."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Paso 5: revisión y confirmación ── */}
        {paso === 4 && resolucion && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border divide-y divide-border/40">
              {items.map((i) => (
                <div key={i.id_detalle} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{i.cantidad} × {i.descripcion}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {MOTIVO_LABELS[i.motivo]} · {CONDICION_LABELS[i.condicion]} → {DESTINO_LABELS[i.destino]}
                    </p>
                  </div>
                  <span className="num font-medium shrink-0">{soles(i.importe)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold">
                <span>Total a devolver · {RESOLUCION_LABELS[resolucion]}</span>
                <span className="num">{soles(total)}</span>
              </div>
              {resolucion === "cambio_producto" && diferencia !== 0 && (
                <div className="flex items-center justify-between px-4 py-2 text-xs">
                  <span>{diferencia > 0 ? "El cliente paga la diferencia" : "Saldo a favor del cliente"}</span>
                  <span className="num font-medium">{soles(Math.abs(diferencia))}</span>
                </div>
              )}
            </div>

            {evaluacion.errores.map((e) => (
              <p key={e} className="flex items-start gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{e}
              </p>
            ))}
            {evaluacion.advertencias.map((a) => (
              <p key={a} className="flex items-start gap-1.5 text-xs text-warning">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />{a}
              </p>
            ))}
            {evaluacion.requiere_aprobacion && (
              <Badge variant="secondary">Se enviará como pendiente de aprobación</Badge>
            )}
          </div>
        )}

        {/* ── Footer de navegación ── */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <Button variant="ghost" size="sm" disabled={paso === 0} onClick={() => setPaso((p) => p - 1)}>
            Atrás
          </Button>
          {paso < 4 ? (
            <Button size="sm" disabled={!puedeAvanzar()} onClick={() => setPaso((p) => p + 1)}>
              Siguiente
            </Button>
          ) : (
            <Button size="sm" disabled={!puedeAvanzar()} onClick={confirmar}>
              {crear.isPending ? "Procesando…" : "Confirmar devolución"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

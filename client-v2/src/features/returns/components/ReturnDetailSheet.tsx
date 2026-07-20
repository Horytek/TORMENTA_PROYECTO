// ─────────────────────────────────────────────────────────────────
// Panel lateral con el detalle completo de una devolución: resumen
// financiero, productos, destinos de inventario, evidencias e historial.
// Las acciones de transición viven en la lista (config/collection.tsx);
// acá solo lectura + auditoría.
// ─────────────────────────────────────────────────────────────────
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Can } from "@/components/shared/Can";
import type { Devolucion } from "../types";
import {
  CANAL_LABELS, CONDICION_LABELS, DESTINO_LABELS, ESTADO_META,
  MOTIVO_LABELS, RESOLUCION_LABELS, soles,
} from "../config/catalog";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium truncate">{value ?? "—"}</span>
    </div>
  );
}

export function ReturnDetailSheet({
  devolucion,
  onClose,
}: {
  devolucion: Devolucion | null;
  onClose: () => void;
}) {
  const d = devolucion;
  return (
    <Sheet open={!!d} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {d && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {d.codigo}
                <Badge variant="secondary">{ESTADO_META[d.estado]?.label ?? d.estado}</Badge>
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4 mt-4 px-1">
              {/* ── Origen y contexto ── */}
              <section>
                <Row label="Venta original" value={d.num_comprobante || `#${d.id_venta}`} />
                <Row label="Cliente" value={d.nom_cliente || "Cliente general"} />
                <Row label="Sucursal" value={d.nombre_sucursal} />
                <Row label="Canal" value={CANAL_LABELS[d.canal]} />
                <Row label="Fecha" value={new Date(d.fecha).toLocaleString("es-PE")} />
                <Row label="Responsable" value={d.responsable} />
                {d.aprobador && <Row label="Aprobado por" value={d.aprobador} />}
              </section>

              <Separator />

              {/* ── Productos ── */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Productos ({d.items?.length ?? 0})
                </h4>
                {d.items?.map((i) => (
                  <div key={i.id_detalle} className="rounded-lg border border-border/60 px-3 py-2 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{i.cantidad} × {i.descripcion}</span>
                      <span className="num font-medium shrink-0">{soles(i.importe)}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {[i.sku, i.nom_talla, i.nom_tonalidad, i.lote, i.serie].filter(Boolean).join(" · ") || null}
                    </p>
                    <p className="text-muted-foreground">
                      {MOTIVO_LABELS[i.motivo]}{i.motivo_detalle ? ` — ${i.motivo_detalle}` : ""}
                    </p>
                    <p>
                      <span className="text-muted-foreground">{CONDICION_LABELS[i.condicion]}</span>
                      {" → "}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{DESTINO_LABELS[i.destino]}</Badge>
                    </p>
                    {i.producto_cambio && (
                      <p className="text-muted-foreground">
                        Cambio por: {i.producto_cambio.cantidad} × {i.producto_cambio.descripcion} ({soles(i.producto_cambio.precio_unitario)})
                      </p>
                    )}
                  </div>
                ))}
              </section>

              <Separator />

              {/* ── Resumen financiero ── */}
              <section>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Resumen financiero
                </h4>
                <Row label="Resolución" value={RESOLUCION_LABELS[d.resolucion]} />
                <Row label="Total devuelto" value={<span className="num">{soles(d.total)}</span>} />
                {d.diferencia_cambio != null && d.diferencia_cambio !== 0 && (
                  <Row
                    label={d.diferencia_cambio > 0 ? "Cliente paga diferencia" : "Saldo a favor del cliente"}
                    value={<span className="num">{soles(Math.abs(d.diferencia_cambio))}</span>}
                  />
                )}
              </section>

              {/* ── Observaciones y evidencias ── */}
              {(d.observaciones || d.evidencias?.length) && (
                <>
                  <Separator />
                  <section className="space-y-1 text-xs">
                    {d.observaciones && <p className="text-muted-foreground">{d.observaciones}</p>}
                    {d.evidencias?.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="block text-primary truncate hover:underline">
                        {url}
                      </a>
                    ))}
                  </section>
                </>
              )}

              {/* ── Historial / auditoría ── */}
              <Can capability="devoluciones.auditoria">
                {d.historial && d.historial.length > 0 && (
                  <>
                    <Separator />
                    <section>
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Historial
                      </h4>
                      <ol className="space-y-2 border-l border-border/60 pl-3">
                        {d.historial.map((h, idx) => (
                          <li key={idx} className="text-xs relative">
                            <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-border" />
                            <p className="font-medium">
                              {h.de ? `${ESTADO_META[h.de]?.label} → ` : ""}{ESTADO_META[h.a]?.label}
                            </p>
                            <p className="text-muted-foreground">
                              {h.usuario} · {new Date(h.fecha).toLocaleString("es-PE")}
                            </p>
                            {h.nota && <p className="text-muted-foreground italic">{h.nota}</p>}
                          </li>
                        ))}
                      </ol>
                    </section>
                  </>
                )}
              </Can>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

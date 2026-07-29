import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, PackageCheck, Ban, FileText, Loader2, Calendar, Building2, Warehouse } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { getPurchaseOrder } from "../api/purchases";
import type { EstadoOrdenCompra } from "../types";

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  draft: "Borrador",
  approved: "Aprobada",
  partially_received: "Recepción parcial",
  received: "Recibida",
  cancelled: "Cancelada",
};

const ESTADO_BADGE: Record<EstadoOrdenCompra, "secondary" | "success" | "destructive"> = {
  draft: "secondary",
  approved: "secondary",
  partially_received: "secondary",
  received: "success",
  cancelled: "destructive",
};

const PASOS: { key: EstadoOrdenCompra; label: string }[] = [
  { key: "draft", label: "Orden creada" },
  { key: "approved", label: "Aprobada" },
  { key: "received", label: "Recepcionada" },
];

interface PurchaseOrderDetailDrawerProps {
  orderId: number | null;
  onClose: () => void;
  canApprove: boolean;
  canReceive: boolean;
  canCancel: boolean;
  onApprove: (id: number) => void;
  onReceive: (id: number, items?: { id_detalle_orden_compra: number; cantidad: number }[]) => void;
  onCancel: (id: number) => void;
  isMutating: boolean;
}

export function PurchaseOrderDetailDrawer({
  orderId,
  onClose,
  canApprove,
  canReceive,
  canCancel,
  onApprove,
  onReceive,
  onCancel,
  isMutating,
}: PurchaseOrderDetailDrawerProps) {
  const { data: orden, isLoading } = useQuery({
    queryKey: ["purchase-order", orderId],
    queryFn: () => getPurchaseOrder(orderId as number),
    enabled: orderId != null,
  });

  const [qtyById, setQtyById] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!orden) return;
    const initial: Record<number, string> = {};
    for (const it of orden.items) {
      const pendiente = Number(it.cantidad) - Number(it.cantidad_recibida);
      if (pendiente > 0) initial[it.id_detalle_orden_compra] = String(pendiente);
    }
    setQtyById(initial);
  }, [orden]);

  const isOpen = orderId != null;
  const isCancelled = orden?.estado === "cancelled";
  // `partially_received` no es un paso propio del timeline: se muestra a medio camino de "Recepcionada".
  const pasoActualIndex = orden
    ? orden.estado === "partially_received"
      ? PASOS.findIndex((p) => p.key === "approved")
      : PASOS.findIndex((p) => p.key === orden.estado)
    : -1;

  const buildReceiveItems = () => {
    if (!orden) return undefined;
    const items = orden.items
      .map((it) => ({ id_detalle_orden_compra: it.id_detalle_orden_compra, cantidad: Number(qtyById[it.id_detalle_orden_compra] ?? 0) }))
      .filter((it) => it.cantidad > 0);
    return items.length > 0 ? items : undefined;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border/40 p-5 pr-12">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-base font-bold tracking-tight text-foreground">
                Orden de Compra #{orderId}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {orden?.proveedor ?? "—"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading || !orden ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant={ESTADO_BADGE[orden.estado]} className="font-normal">
                  {ESTADO_LABEL[orden.estado]}
                </Badge>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /> Fecha:
                  </span>
                  <span className="font-medium text-foreground">{formatFecha(orden.fecha)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /> Proveedor:
                  </span>
                  <span className="font-medium text-foreground truncate max-w-[200px]">{orden.proveedor}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /> Almacén destino:
                  </span>
                  <span className="font-medium text-foreground">{orden.almacen}</span>
                </div>
              </div>

              {/* Timeline */}
              {!isCancelled && (
                <div className="rounded-xl border border-border/40 p-4 space-y-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Progreso
                  </h3>
                  <div className="space-y-3">
                    {PASOS.map((paso, idx) => {
                      const done = idx <= pasoActualIndex;
                      return (
                        <div key={paso.key} className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]",
                              done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {done ? <Check className="h-3 w-3" /> : idx + 1}
                          </span>
                          <span className={cn("text-sm", done ? "text-foreground font-medium" : "text-muted-foreground")}>
                            {paso.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator className="bg-border/40" />

              <div className="space-y-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Productos ({orden.items.length})
                </h3>
                <div className="rounded-xl border border-border/40 divide-y divide-border/40">
                  {orden.items.map((item) => {
                    const pendiente = Number(item.cantidad) - Number(item.cantidad_recibida);
                    const puedeRecibir = canReceive && pendiente > 0 && !isCancelled && orden.estado !== "received";
                    return (
                      <div key={item.id_detalle_orden_compra} className="p-3">
                        <p className="text-sm font-medium text-foreground">{item.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.marca} · {item.cantidad} × S/ {Number(item.precio_unitario).toFixed(2)} = S/ {Number(item.total).toFixed(2)}
                        </p>
                        {Number(item.cantidad_recibida) > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Recibido: {item.cantidad_recibida} / {item.cantidad}
                          </p>
                        )}
                        {puedeRecibir && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Recibir ahora:</span>
                            <input
                              type="number"
                              min={0}
                              max={pendiente}
                              step="1"
                              value={qtyById[item.id_detalle_orden_compra] ?? ""}
                              onChange={(e) =>
                                setQtyById((prev) => ({ ...prev, [item.id_detalle_orden_compra]: e.target.value }))
                              }
                              className="h-6 w-16 rounded-md border border-border bg-card px-1.5 text-[11px] tabular-nums"
                            />
                            <span className="text-[10px] text-muted-foreground">/ {pendiente} pendiente</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end text-sm font-semibold text-foreground">
                  Total: S/ {orden.items.reduce((sum, i) => sum + Number(i.total), 0).toFixed(2)}
                </div>
              </div>

              {orden.observacion && (
                <div className="space-y-1">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Observaciones
                  </h3>
                  <p className="text-sm text-muted-foreground">{orden.observacion}</p>
                </div>
              )}
            </>
          )}
        </div>

        {orden && !isCancelled && orden.estado !== "received" && (
          <div className="border-t border-border/40 p-5 bg-card flex flex-col gap-2">
            {orden.estado === "draft" && canApprove && (
              <Button className="w-full gap-1.5" disabled={isMutating} onClick={() => onApprove(orden.id)}>
                <Check className="h-4 w-4" /> Aprobar orden
              </Button>
            )}
            {canReceive && (
              <Button
                variant="secondary"
                className="w-full gap-1.5"
                disabled={isMutating}
                onClick={() => onReceive(orden.id, buildReceiveItems())}
              >
                <PackageCheck className="h-4 w-4" />
                {orden.estado === "partially_received" ? "Continuar recepción" : "Recibir mercadería"}
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" className="w-full gap-1.5" disabled={isMutating} onClick={() => onCancel(orden.id)}>
                <Ban className="h-4 w-4" /> Cancelar orden
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

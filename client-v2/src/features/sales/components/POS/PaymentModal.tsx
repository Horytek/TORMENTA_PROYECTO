import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Receipt, Banknote, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { createVenta } from "@/features/sales/api/ventas";
import type { ComprobanteTipo, MetodoPago, VentaPayload } from "@/features/sales/types";
import { CLIENTE_VARIOS } from "./ClientSelector";

// ─────────────────────────────────────────────────────────────────
// PaymentModal — Modal de cobro del POS con sistema de pago mixto
// ─────────────────────────────────────────────────────────────────

type SaleStatus = "idle" | "processing" | "success" | "error";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSaleComplete: (saleId: number, numComprobante: string) => void;
  selectedAlmacenId?: number;
}

// ── Tipos de pago ──────────────────────────────────────────────
type MetodoConMonto = {
  metodo: MetodoPago;
  monto: number;
};

const METODOS_DISPONIBLES: { value: MetodoPago; label: string }[] = [
  { value: "EFECTIVO", label: "💵 Efectivo" },
  { value: "TARJETA", label: "💳 Tarjeta" },
  { value: "TRANSFERENCIA", label: "🏦 Transferencia" },
  { value: "YAPE", label: "📱 Yape" },
  { value: "PLIN", label: "📱 Plin" },
];

const MAX_METODOS = 3;

const crearClaveIdempotente = () =>
  globalThis.crypto?.randomUUID?.() ??
  `venta-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function PaymentModal({ open, onClose, onSaleComplete, selectedAlmacenId }: PaymentModalProps) {
  const cart = useCartStore();
  const user = useUserStore((s) => s.user);

  const [comprobanteTipo, setComprobanteTipo] = useState<ComprobanteTipo>("Boleta");
  const [observaciones, setObservaciones] = useState("");
  const [status, setStatus] = useState<SaleStatus>("idle");
  const [result, setResult] = useState<{ success: boolean; message?: string; num_comprobante?: string } | null>(null);
  const idempotencyKeyRef = useRef(crearClaveIdempotente());
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      idempotencyKeyRef.current = crearClaveIdempotente();
    }
    wasOpenRef.current = open;
  }, [open]);

  // Sistema de pago multi-método
  const [pagos, setPagos] = useState<MetodoConMonto[]>([
    { metodo: "EFECTIVO", monto: 0 },
  ]);

  const subtotal = cart.getSubtotal();
  const igv = cart.getIgv();
  const total = cart.getTotal();

  // Para Nota de venta: solo efectivo, un solo método
  const isNota = comprobanteTipo === "Nota de venta";

  // Métodos ya usados (para evitar duplicados)
  const metodosUsados = useMemo(
    () => new Set(pagos.map((p) => p.metodo)),
    [pagos]
  );

  // Total pagado
  const totalPagado = useMemo(
    () => pagos.reduce((sum, p) => sum + p.monto, 0),
    [pagos]
  );

  // Resta por pagar
  const resta = Math.max(0, total - totalPagado);
  const isCompleto = totalPagado >= total;
  const isExcedente = totalPagado > total;

  // Crédito es excluyente: no se puede mezclar con otro método (todo el total
  // pasa a cuenta por cobrar, no hay monto en efectivo/tarjeta que reconciliar).
  const isCredito = pagos.length === 1 && pagos[0].metodo === "CREDITO";

  // Abrir segundo método cuando el primero no cubre todo (solo para Boleta/Factura)
  const puedeAgregarMetodo = !isNota && !isCredito && pagos.length < MAX_METODOS;

  // Actualizar método de un slot
  const updateMetodo = useCallback((index: number, metodo: MetodoPago) => {
    if (metodo === "CREDITO") {
      setPagos([{ metodo: "CREDITO", monto: total }]);
      return;
    }
    setPagos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], metodo };
      return next;
    });
  }, [total]);

  // Actualizar monto de un slot — auto-reparte el restante en los slots siguientes
  const updateMonto = useCallback((index: number, monto: number) => {
    setPagos((prev) => {
      const next = [...prev];
      const newMonto = Math.max(0, monto);
      next[index] = { ...next[index], monto: newMonto };

      if (!isNota) {
        // 1. Calcular suma hasta el slot editado inclusive
        const sumBefore = next.slice(0, index + 1).reduce((s, p) => s + p.monto, 0);
        let remaining = Math.max(0, total - sumBefore);

        // 2. Si ya se completó o excedió el total, eliminar todos los slots posteriores
        if (remaining === 0) {
          return next.slice(0, index + 1);
        }

        // 3. Si hay slots posteriores, intentar cubrir el restante en ellos
        let activeLength = next.length;
        for (let i = index + 1; i < next.length; i++) {
          if (remaining > 0) {
            next[i] = { ...next[i], monto: remaining };
            remaining = 0;
          } else {
            // Si ya no queda restante para este slot, descartar este y los posteriores
            activeLength = i;
            break;
          }
        }
        
        if (activeLength < next.length) {
          next.splice(activeLength);
        }

        // 4. Si todavía falta y no hemos llegado al máximo, agregar un slot nuevo con el restante
        if (remaining > 0 && next.length < MAX_METODOS) {
          const usedMethods = new Set(next.map((p) => p.metodo));
          const disponible = METODOS_DISPONIBLES.find((m) => !usedMethods.has(m.value));
          if (disponible) {
            next.push({ metodo: disponible.value, monto: remaining });
          }
        }
      }

      return next;
    });
  }, [total, isNota]);

  // Agregar un método nuevo (manual, solo si no estamos en Nota y hay espacio)
  const agregarMetodo = useCallback(() => {
    if (isNota || pagos.length >= MAX_METODOS) return;
    const disponibles = METODOS_DISPONIBLES.filter((m) => !metodosUsados.has(m.value));
    if (disponibles.length === 0) return;
    setPagos((prev) => [...prev, { metodo: disponibles[0].value, monto: 0 }]);
  }, [isNota, pagos.length, metodosUsados]);

  // Eliminar un método (no el primero)
  const eliminarMetodo = useCallback((index: number) => {
    if (index === 0) return; // No eliminar el primero
    setPagos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Resetear al abrir
  useEffect(() => {
    if (open) {
      // Sugerir monto redondeado en efectivo
      setPagos([{ metodo: isNota ? "EFECTIVO" : "EFECTIVO", monto: Math.ceil(total) }]);
      setObservaciones("");
      setStatus("idle");
      setResult(null);
    }
  }, [open, total, isNota]);

  // Construir metodo_pago para el backend (formato "EFECTIVO:50,YAPE:30")
  const metodoPagoBackend = useMemo(() => {
    if (isCredito) return "CREDITO";
    if (isNota) return "EFECTIVO";
    return pagos
      .filter((p) => p.monto > 0)
      .map((p) => `${p.metodo}:${p.monto.toFixed(2)}`)
      .join(",");
  }, [pagos, isNota, isCredito]);

  // Construct received total — en crédito no se cobra nada ahora.
  const montoRecibidoBackend = isCredito ? 0 : totalPagado;

  // Validación antes de enviar
  const validationError = useMemo(() => {
    const clienteFinal = cart.cliente ?? CLIENTE_VARIOS;
    if (comprobanteTipo === "Factura" && (!clienteFinal.ruc || clienteFinal.id_cliente === 0)) {
      return "Debes seleccionar un cliente con RUC para emitir una Factura.";
    }
    if (cart.items.length === 0) return "El carrito está vacío.";
    if (isCredito && clienteFinal.id_cliente === 0) {
      return "Debes seleccionar un cliente para una venta a crédito.";
    }
    if (isNota) {
      if (pagos[0].monto <= 0) return "El monto recibido debe ser mayor a S/ 0.00.";
      if (pagos[0].monto < total) return `El monto recibido (S/ ${pagos[0].monto.toFixed(2)}) es menor al total (S/ ${total.toFixed(2)}).`;
    } else {
      if (totalPagado < total) return `Faltan S/ ${resta.toFixed(2)} por cobrar.`;
      if (isExcedente) {
        const efectivoPago = pagos.find((p) => p.metodo === "EFECTIVO")?.monto || 0;
        const exceso = totalPagado - total;
        if (efectivoPago < exceso) {
          return `El monto recibido excede el total en S/ ${exceso.toFixed(2)} (no hay suficiente efectivo para dar vuelto).`;
        }
      }
      // Verificar que no haya métodos duplicados
      const metodos = pagos.filter((p) => p.monto > 0).map((p) => p.metodo);
      const unique = new Set(metodos);
      if (unique.size !== metodos.length) return "No puedes usar el mismo método de pago más de una vez.";
    }
    return null;
  }, [cart.cliente, cart.items, isNota, isCredito, pagos, total, totalPagado, resta, isExcedente, comprobanteTipo]);

  // Mutación de venta
  const mutation = useMutation({
    mutationFn: async () => {
      // Asegurar cliente "Varios" si no hay ninguno
      const clienteFinal = cart.cliente ?? CLIENTE_VARIOS;
      const clienteNombre =
        clienteFinal.id_cliente === 0
          ? "VARIOS"
          : `${clienteFinal.nombres ?? ""} ${clienteFinal.apellidos ?? ""}`.trim() ||
            clienteFinal.razon_social;

      const payload: VentaPayload = {
        idempotency_key: idempotencyKeyRef.current,
        id_sucursal: user?.id_sucursal ?? undefined,
        id_almacen: selectedAlmacenId ?? undefined,
        id_cliente: clienteFinal.id_cliente === 0 ? null : clienteFinal.id_cliente,
        nombre_cliente: clienteNombre,
        documento_cliente: clienteFinal.id_cliente === 0 ? "00000000" : (clienteFinal.ruc || clienteFinal.dni),
        direccion_cliente: clienteFinal.direccion,
        id_comprobante: comprobanteTipo,
        estado_venta: 1,
        f_venta: new Date().toISOString().split("T")[0],
        metodo_pago: metodoPagoBackend,
        formadepago: metodoPagoBackend,
        igv,
        total_t: total,
        totalImporte_venta: total,
        descuento_venta: cart.descuento,
        vuelto: isCredito ? 0 : Math.max(0, totalPagado - total),
        recibido: montoRecibidoBackend,
        observacion: observaciones || undefined,
        comprobante_pago: metodoPagoBackend,
        detalles: cart.items.map((item) => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          precio_total: item.precio_total,
          id_tonalidad: item.id_tonalidad,
          id_talla: item.id_talla,
          id_sku: item.id_sku,
          descuento: item.descuento,
        })),
      };

      return createVenta(payload);
    },
    onSuccess: (data) => {
      setStatus("success");
      setResult({
        success: data.success,
        message: data.message,
        num_comprobante: data.num_comprobante,
      });
      if (data.success && data.id_venta) {
        cart.clearCart();
        onSaleComplete(data.id_venta, data.num_comprobante || "");
      }
    },
    onError: (err) => {
      setStatus("error");
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Error al procesar la venta",
      });
    },
  });

  const handleSubmit = useCallback(() => {
    if (validationError) return;
    setStatus("processing");
    mutation.mutate();
  }, [validationError, mutation]);

  const handleClose = useCallback(() => {
    if (status === "processing") return;
    if (status === "success" || status === "error") {
      cart.setIsProcessing(false);
    }
    onClose();
  }, [status, cart, onClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-border bg-card flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Receipt className="h-5 w-5 text-primary" />
            {status === "idle" && "Cobrar"}
            {status === "processing" && "Procesando…"}
            {status === "success" && "Venta completada"}
            {status === "error" && "Error en la venta"}
          </DialogTitle>
        </DialogHeader>

        {/* ── IDLE: Formulario ── */}
        {status === "idle" && (
          <div className="space-y-4 overflow-y-auto">
            {/* Totales */}
            <div className="rounded-xl border border-border bg-zinc-50/50 dark:bg-zinc-900/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IGV (18%)</span>
                <span className="font-medium">S/ {igv.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <Label htmlFor="pos-descuento" className="text-muted-foreground font-normal">Descuento</Label>
                <div className="relative w-28">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">S/</span>
                  <Input
                    id="pos-descuento"
                    type="number"
                    min={0}
                    step={0.01}
                    value={cart.descuento || ""}
                    onChange={(e) => cart.setDescuento(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-7 pl-7 text-right text-sm"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary text-xl">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Comprobante */}
            <div className="space-y-1.5">
              <Label>Tipo de comprobante</Label>
              <Select
                value={comprobanteTipo}
                onValueChange={(v) => setComprobanteTipo(v as ComprobanteTipo)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boleta">📄 Boleta de Venta</SelectItem>
                  <SelectItem value="Factura">📋 Factura</SelectItem>
                  <SelectItem value="Nota de venta">📝 Nota de Venta (solo efectivo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Sistema de pago multi-método ── */}
            <div className="space-y-2">
              <Label>Método(s) de pago</Label>
              <div className="space-y-2">
                {pagos.map((pago, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {/* Selector de método */}
                    <Select
                      value={pago.metodo}
                      onValueChange={(v) => updateMetodo(index, v as MetodoPago)}
                      disabled={isNota}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METODOS_DISPONIBLES.map((m) => {
                          const disabled = metodosUsados.has(m.value) && m.value !== pago.metodo;
                          return (
                            <SelectItem key={m.value} value={m.value} disabled={disabled && !isNota}>
                              {m.label}
                            </SelectItem>
                          );
                        })}
                        {index === 0 && (
                          <SelectItem value="CREDITO" disabled={pagos.length > 1}>
                            🧾 Crédito (cuenta por cobrar)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Input monto */}
                    <div className="relative flex-1">
                      <Banknote className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={pago.monto || ""}
                        onChange={(e) => updateMonto(index, Number(e.target.value) || 0)}
                        disabled={isNota || isCredito}
                        placeholder="0.00"
                        className="pl-8 font-mono text-sm text-right"
                      />
                    </div>

                    {/* Eliminar método extra */}
                    {!isNota && index > 0 && (
                      <button
                        onClick={() => eliminarMetodo(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isCredito && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  No se cobra nada ahora. El total queda como cuenta por cobrar del cliente.
                </p>
              )}

              {/* Agregar método extra */}
              {!isNota && puedeAgregarMetodo && metodosUsados.size < METODOS_DISPONIBLES.length && (
                <button
                  onClick={agregarMetodo}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/40 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Agregar método de pago
                </button>
              )}

              {/* Indicadores de progreso */}
              <div className="space-y-1">
                {/* Barra de progreso */}
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (totalPagado / total) * 100)}%`,
                      backgroundColor: isCompleto ? "#22c55e" : isExcedente ? "#f59e0b" : "#3b82f6",
                    }}
                  />
                </div>

                {/* Info de resta/pagado */}
                <div className="flex justify-between text-xs">
                  <span className={totalPagado < total ? "text-amber-600" : totalPagado > total ? "text-amber-600" : "text-emerald-600"}>
                    {totalPagado < total
                      ? `💰 Faltan S/ ${(total - totalPagado).toFixed(2)}`
                      : totalPagado > total
                      ? `⚠️ Exceso S/ ${(totalPagado - total).toFixed(2)}`
                      : "✅ Monto completo"}
                  </span>
                  <span className="text-muted-foreground">
                    Recibido: S/ {totalPagado.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-1.5">
              <Label>Observaciones (opcional)</Label>
              <Input
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="SinObservaciones"
                className="text-sm"
              />
            </div>

            {/* Error de validación */}
            {validationError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-destructive font-medium">{validationError}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              disabled={Boolean(validationError)}
              onClick={handleSubmit}
            >
              <span className="text-base font-bold mr-1">✅</span>
              Confirmar venta — S/ {total.toFixed(2)}
            </Button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {status === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground text-center">
              Registrando venta y emitiendo comprobante electrónico…
            </p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === "success" && result?.success && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-2 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-800">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ¡Venta exitosa!
              </h3>
              {result.num_comprobante && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Comprobante: <strong>{result.num_comprobante}</strong>
                </p>
              )}
              {result.message && (
                <p className="mt-1 text-xs text-muted-foreground">{result.message}</p>
              )}
            </div>
            <Button className="w-full" onClick={handleClose}>
              Nueva venta
            </Button>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-2 ring-red-200 dark:bg-red-950 dark:ring-red-800">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                Error en la venta
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {result?.message ?? "No se pudo procesar la venta."}
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cerrar
              </Button>
              <Button className="flex-1" onClick={() => setStatus("idle")}>
                Reintentar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

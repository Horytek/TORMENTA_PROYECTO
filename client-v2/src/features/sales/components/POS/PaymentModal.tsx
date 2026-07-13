import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Receipt, Banknote } from "lucide-react";
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

// ─────────────────────────────────────────────────────────────────
// PaymentModal — Modal de cobro del POS
// ─────────────────────────────────────────────────────────────────

type SaleStatus = "idle" | "processing" | "success" | "error";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSaleComplete: (saleId: number, numComprobante: string) => void;
}

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: "EFECTIVO", label: "💵 Efectivo" },
  { value: "TARJETA", label: "💳 Tarjeta" },
  { value: "TRANSFERENCIA", label: "🏦 Transferencia" },
  { value: "YAPE", label: "📱 Yape" },
  { value: "PLIN", label: "📱 Plin" },
  { value: "MIXTO", label: "🔄 Mixto" },
];

export function PaymentModal({ open, onClose, onSaleComplete }: PaymentModalProps) {
  const cart = useCartStore();
  const user = useUserStore((s) => s.user);

  const [comprobanteTipo, setComprobanteTipo] = useState<ComprobanteTipo>("Boleta");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [observaciones, setObservaciones] = useState("");
  const [status, setStatus] = useState<SaleStatus>("idle");
  const [result, setResult] = useState<{ success: boolean; message?: string; num_comprobante?: string } | null>(null);

  const subtotal = cart.getSubtotal();
  const igv = cart.getIgv();
  const total = cart.getTotal();
  const vuelto = Math.max(0, montoRecibido - total);
  const isEfectivo = metodoPago === "EFECTIVO";
  const montoInsuficiente = isEfectivo && montoRecibido > 0 && montoRecibido < total;

  // Resetear al abrir
  useEffect(() => {
    if (open) {
      setMontoRecibido(Math.ceil(total)); // Suggest round amount
      setObservaciones("");
      setStatus("idle");
      setResult(null);
      setComprobanteTipo(cart.comprobanteTipo);
      setMetodoPago(cart.metodoPago);
    }
  }, [open, total, cart.comprobanteTipo, cart.metodoPago]);

  // Mutación de venta
  const mutation = useMutation({
    mutationFn: async () => {
      const payload: VentaPayload = {
        id_sucursal: user?.id ?? 1,
        id_almacen: 1,
        id_cliente: cart.cliente?.id_cliente,
        nombre_cliente: cart.cliente
          ? `${cart.cliente.nombres ?? ""} ${cart.cliente.apellidos ?? ""}`.trim() || cart.cliente.razon_social
          : undefined,
        documento_cliente: cart.cliente?.ruc || cart.cliente?.dni,
        direccion_cliente: cart.cliente?.direccion,
        id_comprobante: comprobanteTipo,
        estado_venta: 1,
        f_venta: new Date().toISOString().split("T")[0],
        metodo_pago: metodoPago,
        formadepago: metodoPago,
        igv,
        total_t: total,
        totalImporte_venta: total,
        descuento_venta: 0,
        vuelto: isEfectivo ? vuelto : 0,
        recibido: montoRecibido,
        observacion: observaciones,
        comprobante_pago: metodoPago,
        detalles: cart.items.map((item) => ({
          id_producto: item.id_producto,
          id_variante: item.id_variante,
          sku: item.sku,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          precio_total: item.precio_total,
        })),
      };

      const res = await createVenta(payload);
      return res;
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
    if (isEfectivo && montoRecibido < total) return;
    setStatus("processing");
    mutation.mutate();
  }, [isEfectivo, montoRecibido, total, mutation]);

  const handleClose = useCallback(() => {
    if (status === "processing") return; // No cerrar durante procesamiento
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
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary text-xl">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Comprobante */}
            <div className="space-y-1.5">
              <Label>Tipo de comprobante</Label>
              <Select value={comprobanteTipo} onValueChange={(v) => setComprobanteTipo(v as ComprobanteTipo)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boleta">📄 Boleta de Venta</SelectItem>
                  <SelectItem value="Factura">📋 Factura</SelectItem>
                  <SelectItem value="Nota">📝 Nota de Venta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Método de pago */}
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPago)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monto recibido (solo efectivo) */}
            {isEfectivo && (
              <div className="space-y-1.5">
                <Label>Monto recibido (S/)</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={montoRecibido || ""}
                    onChange={(e) => setMontoRecibido(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-9 font-mono text-base"
                  />
                </div>
                {montoInsuficiente && (
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ Monto insuficiente. Faltan S/ {(total - montoRecibido).toFixed(2)}
                  </p>
                )}
                {vuelto > 0 && (
                  <div className="flex justify-between text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Vuelto</span>
                    <span>S/ {vuelto.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

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

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              disabled={isEfectivo && montoInsuficiente}
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

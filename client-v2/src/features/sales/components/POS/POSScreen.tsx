import { useState, useCallback } from "react";
import { User } from "lucide-react";
import { ProductCatalog } from "./ProductCatalog";
import { CartPanel } from "./CartPanel";
import { PaymentModal } from "./PaymentModal";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { clienteNombre } from "@/features/sales/types";

// ─────────────────────────────────────────────────────────────────
// POSScreen — Pantalla principal del Punto de Venta
// ─────────────────────────────────────────────────────────────────

interface POSScreenProps {
  onSaleComplete?: (saleId: number, numComprobante: string) => void;
}

export function POSScreen({ onSaleComplete }: POSScreenProps) {
  const user = useUserStore((s) => s.user);
  const cliente = useCartStore((s) => s.cliente);
  const setCliente = useCartStore((s) => s.setCliente);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);

  const handleCheckout = useCallback(() => {
    setIsPaymentOpen(true);
  }, []);

  const handleSaleComplete = useCallback((saleId: number, numComprobante: string) => {
    setLastSaleId(saleId);
    onSaleComplete?.(saleId, numComprobante);
  }, [onSaleComplete]);

  const handleClosePayment = useCallback(() => {
    setIsPaymentOpen(false);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          {cliente ? (
            <button
              onClick={() => setCliente(null)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{clienteNombre(cliente)}</span>
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                {cliente.ruc ? "RUC" : "DNI"} {cliente.ruc || cliente.dni || "—"}
              </Badge>
            </button>
          ) : (
            <button
              onClick={() => { /* TODO: selector de cliente */ }}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
            >
              <User className="h-3 w-3" />
              Sin cliente
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user?.sucursal && (
            <Badge variant="secondary" className="text-xs">
              📍 {user.sucursal}
            </Badge>
          )}
          {lastSaleId && (
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
              ✓ Venta #{lastSaleId}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0">
          <ProductCatalog />
        </div>
        <div className="w-full md:w-[380px] lg:w-[440px] xl:w-[500px] shrink-0 flex flex-col min-h-0">
          <CartPanel onCheckout={handleCheckout} disabled={false} />
        </div>
      </div>

      {/* ── Modal de pago ──────────────────────────────────── */}
      <PaymentModal
        open={isPaymentOpen}
        onClose={handleClosePayment}
        onSaleComplete={handleSaleComplete}
      />
    </div>
  );
}

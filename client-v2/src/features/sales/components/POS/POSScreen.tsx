import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCatalog } from "./ProductCatalog";
import { CartPanel } from "./CartPanel";
import { PaymentModal } from "./PaymentModal";
import { ClientSelector, CLIENTE_VARIOS } from "./ClientSelector";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useUserStore } from "@/store/useUserStore";
import { getNegocio } from "@/features/settings/api/settings";
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
  const setIgvIncluido = useConfigStore((s) => s.setIgvIncluido);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);

  // Cargar configuración global de IGV al montar
  const { data: negocio } = useQuery({
    queryKey: ["negocio"],
    queryFn: getNegocio,
    staleTime: Infinity, // la config de empresa cambia poco; no refetch en background
  });

  // Sincronizar igv_incluido al store de config global
  useEffect(() => {
    if (negocio?.igv_incluido !== undefined) {
      setIgvIncluido(negocio.igv_incluido);
    }
  }, [negocio, setIgvIncluido]);

  // Asegurar que siempre hay cliente (default "Varios") antes de cobrar
  const handleCheckout = useCallback(() => {
    if (!cliente) {
      setCliente(CLIENTE_VARIOS);
    }
    setIsPaymentOpen(true);
  }, [cliente, setCliente]);

  const handleSaleComplete = useCallback((saleId: number, numComprobante: string) => {
    setLastSaleId(saleId);
    onSaleComplete?.(saleId, numComprobante);
  }, [onSaleComplete]);

  const handleClosePayment = useCallback(() => {
    setLastSaleId(null);
    setIsPaymentOpen(false);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header bar ─────────────────────────────────────── */}
      <div className="relative z-30 flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <ClientSelector
            value={cliente}
            onChange={(c) => setCliente(c ?? CLIENTE_VARIOS)}
          />
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

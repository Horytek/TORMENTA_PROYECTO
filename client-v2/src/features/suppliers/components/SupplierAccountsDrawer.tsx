import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Receipt } from "lucide-react";

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
import { usePermissions } from "@/hooks/usePermissions";

import { getAccountsPayable } from "@/features/purchases/api/purchases";
import RegisterPaymentDialog from "@/features/purchases/components/RegisterPaymentDialog";
import type { AccountPayable } from "@/features/purchases/types";
import { proveedorNombre } from "../types";
import type { Proveedor } from "../types";

const soles = (v: unknown) => `S/ ${Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagada_parcial: "Pago parcial",
  pagada: "Pagada",
  vencida: "Vencida",
};

interface Props {
  proveedor: Proveedor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierAccountsDrawer({ proveedor, isOpen, onClose }: Props) {
  const { can, isDeveloper } = usePermissions();
  const canRegistrarPago = isDeveloper || can("compras/cuentas-por-pagar.generate");
  const [cuentaPago, setCuentaPago] = useState<AccountPayable | null>(null);

  const queryKey = ["cuentas-por-pagar", proveedor?.id];
  const { data: cuentas = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getAccountsPayable({ id_destinatario: proveedor!.id }),
    enabled: isOpen && !!proveedor,
  });

  const saldoTotal = cuentas.reduce((sum, c) => sum + Number(c.saldo), 0);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-brand" />
              Cuentas por pagar
            </SheetTitle>
            <SheetDescription>{proveedor ? proveedorNombre(proveedor) : ""}</SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleDollarSign className="h-4 w-4" />
                Saldo pendiente total
              </div>
              <span className={`text-base font-bold ${saldoTotal > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                {soles(saldoTotal)}
              </span>
            </div>

            <Separator />

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
              </div>
            ) : cuentas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Este proveedor no tiene facturas de compra registradas.
              </p>
            ) : (
              <div className="space-y-2">
                {cuentas.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {c.num_factura || `Factura #${c.id_factura_compra}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vence: {c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString("es-PE") : "—"}
                        </p>
                      </div>
                      <Badge variant={c.estado === "pagada" ? "secondary" : c.estado === "vencida" ? "destructive" : "warning"} className="text-[10px]">
                        {ESTADO_LABEL[c.estado] ?? c.estado}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Total {soles(c.monto_total)} · Saldo <span className="font-semibold text-foreground">{soles(c.saldo)}</span>
                      </span>
                      {canRegistrarPago && c.estado !== "pagada" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCuentaPago(c)}>
                          Registrar pago
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <RegisterPaymentDialog
        cuenta={cuentaPago}
        onClose={() => setCuentaPago(null)}
        invalidateKeys={[queryKey]}
      />
    </>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, History, ReceiptText, CreditCard, Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getComprasCliente, getHistorialCliente, getCuentasPorCobrarCliente, registrarCobroCuenta,
} from "../api/clientes";
import { clienteNombre } from "../types";
import type { Cliente, CuentaPorCobrar } from "../types";

const soles = (v: unknown) => `S/ ${Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagada_parcial: "Pago parcial",
  pagada: "Pagada",
};

interface Props {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientHistoryDrawer({ cliente, isOpen, onClose }: Props) {
  const { can, isDeveloper } = usePermissions();
  const canRegistrarCobro = isDeveloper || can("clientes/cuentas-por-cobrar.generate");
  const queryClient = useQueryClient();
  const [cuentaCobro, setCuentaCobro] = useState<CuentaPorCobrar | null>(null);

  const { data: compras = [], isLoading: loadingCompras } = useQuery({
    queryKey: ["cliente-compras", cliente?.id],
    queryFn: () => getComprasCliente(cliente!.id),
    enabled: isOpen && !!cliente,
  });

  const { data: historial = [], isLoading: loadingHistorial } = useQuery({
    queryKey: ["cliente-historial", cliente?.id],
    queryFn: () => getHistorialCliente(cliente!.id),
    enabled: isOpen && !!cliente,
  });

  const { data: cuentasPorCobrar = [], isLoading: loadingCxC } = useQuery({
    queryKey: ["cliente-cuentas-por-cobrar", cliente?.id],
    queryFn: () => getCuentasPorCobrarCliente(cliente!.id),
    enabled: isOpen && !!cliente,
  });

  const totalComprado = compras.reduce((sum, c) => sum + Number(c.total), 0);
  const saldoPendiente = cuentasPorCobrar.reduce((sum, c) => sum + Number(c.saldo), 0);
  const limiteCredito = cliente?.limite_credito != null ? Number(cliente.limite_credito) : null;
  const excedeLimite = limiteCredito != null && saldoPendiente > limiteCredito;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-brand" />
              Historial del cliente
            </SheetTitle>
            <SheetDescription>{cliente ? clienteNombre(cliente) : ""}</SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ReceiptText className="h-4 w-4" />
                Total comprado ({compras.length} {compras.length === 1 ? "compra" : "compras"})
              </div>
              <span className="text-base font-bold text-foreground">{soles(totalComprado)}</span>
            </div>

            {/* Crédito */}
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" /> Crédito
              </h3>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Saldo pendiente
                  {limiteCredito != null && <span> · Límite {soles(limiteCredito)}</span>}
                </div>
                <span className={`text-base font-bold ${excedeLimite ? "text-destructive" : "text-foreground"}`}>
                  {soles(saldoPendiente)}
                </span>
              </div>

              {loadingCxC ? (
                <div className="mt-2 space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
              ) : cuentasPorCobrar.length === 0 ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">Sin ventas a crédito pendientes.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {cuentasPorCobrar.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">Venta #{c.id_venta}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString("es-PE") : "—"}
                          </p>
                        </div>
                        <Badge variant={c.estado === "pagada" ? "secondary" : c.estado === "pagada_parcial" ? "warning" : "destructive"} className="text-[10px]">
                          {ESTADO_LABEL[c.estado] ?? c.estado}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Total {soles(c.monto_total)} · Saldo <span className="font-semibold text-foreground">{soles(c.saldo)}</span>
                        </span>
                        {canRegistrarCobro && c.estado !== "pagada" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCuentaCobro(c)}>
                            Registrar cobro
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Compras */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compras recientes</h3>
              {loadingCompras ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
              ) : compras.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin compras registradas.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {compras.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">Venta #{c.id}</p>
                        <p className="text-xs text-muted-foreground">{c.fecha} · {c.items} {c.items === 1 ? "ítem" : "ítems"}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{soles(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Historial / auditoría */}
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <History className="h-3.5 w-3.5" /> Actividad
              </h3>
              {loadingHistorial ? (
                <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />)}</div>
              ) : historial.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin actividad registrada.</p>
              ) : (
                <ul className="space-y-2">
                  {historial.map((h) => (
                    <li key={h.id_log} className="text-xs">
                      <span className="font-medium text-foreground">{h.accion}</span>
                      {h.descripcion && <span className="text-muted-foreground"> — {h.descripcion}</span>}
                      <div className="text-[10px] text-muted-foreground">{h.fecha} {h.usuario ? `· ${h.usuario}` : ""}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <RegistrarCobroDialog
        cuenta={cuentaCobro}
        onClose={() => setCuentaCobro(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["cliente-cuentas-por-cobrar", cliente?.id] });
          setCuentaCobro(null);
        }}
      />
    </>
  );
}

// ── Registrar cobro ─────────────────────────────────────────────────
const MEDIOS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "YAPE", "PLIN", "CHEQUE"];

function RegistrarCobroDialog({ cuenta, onClose, onSuccess }: { cuenta: CuentaPorCobrar | null; onClose: () => void; onSuccess: () => void }) {
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [medioPago, setMedioPago] = useState("EFECTIVO");
  const [referencia, setReferencia] = useState("");

  const mutation = useMutation({
    mutationFn: () => registrarCobroCuenta(cuenta!.id, { monto: Number(monto), fecha, medio_pago: medioPago, referencia: referencia || undefined }),
    onSuccess: () => {
      setMonto(""); setReferencia("");
      onSuccess();
    },
  });

  if (!cuenta) return null;

  return (
    <Sheet open={!!cuenta} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Registrar cobro</SheetTitle>
          <SheetDescription>
            Saldo pendiente: <span className="font-semibold text-foreground">{soles(cuenta.saldo)}</span>
          </SheetDescription>
        </SheetHeader>

        <form className="space-y-4 px-4 pb-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Monto cobrado</label>
            <Input type="number" min={0.01} max={Number(cuenta.saldo)} step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Fecha</label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Medio de pago</label>
            <Select value={medioPago} onValueChange={setMedioPago}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEDIOS_PAGO.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Referencia (opcional)</label>
            <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="N° de operación…" />
          </div>

          {mutation.isError && (
            <p className="text-xs text-destructive">No se pudo registrar el cobro. Verifica el monto.</p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={mutation.isPending || !monto}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar cobro
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

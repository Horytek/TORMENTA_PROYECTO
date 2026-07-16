import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, CalendarDays, Banknote, Receipt, History, CreditCard, AlertTriangle, ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserStore } from "@/store/useUserStore";

import { getEmpresaAccount } from "../api/account";
import { getMpPayments, createPreference, requestPlanChange } from "../api/billing";

const PLAN_LABELS: Record<string, string> = { "1": "Enterprise", "2": "Pro", "3": "Basic" };

interface BillingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillingDrawer({ isOpen, onClose }: BillingDrawerProps) {
  const user = useUserStore((s) => s.user);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [targetPlan, setTargetPlan] = useState("");
  const [reason, setReason] = useState("");
  const [planChangeMsg, setPlanChangeMsg] = useState<string | null>(null);

  const { data: empresa } = useQuery({
    queryKey: ["billing-empresa", user?.id_empresa],
    queryFn: () => getEmpresaAccount(user!.id_empresa!),
    enabled: isOpen && !!user?.id_empresa,
  });
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["billing-payments"], queryFn: getMpPayments, enabled: isOpen,
  });

  const planLabel = PLAN_LABELS[String(user?.plan_pago)] || "Básico";
  const costo = empresa?.costo || (String(user?.plan_pago) === "1" ? "S/ 240" : String(user?.plan_pago) === "2" ? "S/ 135" : "S/ 85");
  const vencimiento = empresa?.fecha_vencimiento || user?.original?.fecha_vencimiento || null;
  const vencido = vencimiento ? new Date(vencimiento) < new Date() : false;

  const diasParaVencer = vencimiento ? Math.ceil((new Date(vencimiento).getTime() - Date.now()) / 86400000) : null;
  const canPay = diasParaVencer === null || diasParaVencer <= 5;

  const renewalMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(String(costo).replace(/[^\d.]/g, "")) || 0;
      const empresaName = empresa?.razonSocial || empresa?.nombreComercial || "Empresa";
      const correo = empresa?.email || "";
      const result = await createPreference({
        items: [{
          id: `RENEW_${user?.plan_pago}_${Date.now()}`,
          title: `Renovación Plan ${planLabel}`,
          quantity: 1,
          unit_price: amount,
          description: `Renovación mensual del plan ${planLabel} para ${empresaName}`,
        }],
        payer: { email: correo, name: empresaName },
        external_reference: correo,
        back_urls: {
          success: `${window.location.origin}/success`,
          failure: `${window.location.origin}/failure`,
          pending: `${window.location.origin}/pending`,
        },
        auto_return: "approved",
      });
      if (!result.success || !result.id) throw new Error(result.message || "No se pudo generar el enlace de pago");
      return result.id;
    },
    onSuccess: (id) => {
      window.location.href = `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${id}`;
    },
  });

  const planChangeMutation = useMutation({
    mutationFn: () => requestPlanChange({
      current_plan: planLabel,
      target_plan: targetPlan,
      reason,
      requester_email: empresa?.email || "",
      requester_name: empresa?.razonSocial || empresa?.nombreComercial || "",
    }),
    onSuccess: (result) => {
      if (!result.success) {
        setPlanChangeMsg(result.message || "No se pudo enviar la solicitud.");
        return;
      }
      setPlanChangeMsg("Solicitud enviada. Te contactaremos pronto.");
      setTargetPlan("");
      setReason("");
      setShowPlanChange(false);
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle>Facturación</SheetTitle>
              <SheetDescription className="text-xs">Plan y métodos de pago</SheetDescription>
            </div>
            <Badge variant="secondary">{planLabel}</Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
            <div>
              <p className="font-semibold text-foreground">{empresa?.razonSocial || empresa?.nombreComercial || "Empresa"}</p>
              <p className="text-xs text-muted-foreground">{empresa?.email || "-"}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-center text-xs">
              <div className="rounded-lg bg-muted/30 p-2">
                <CalendarDays className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                <p className="font-semibold text-foreground">{vencimiento ? new Date(vencimiento).toLocaleDateString() : "-"}</p>
                <p className="text-muted-foreground">Vence</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <Banknote className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                <p className="font-semibold text-foreground">{costo}</p>
                <p className="text-muted-foreground">Costo</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-2">
                <Receipt className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
                <p className="font-semibold text-foreground">{payments.length}</p>
                <p className="text-muted-foreground">Pagos</p>
              </div>
            </div>
          </div>

          {vencido && (
            <p className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Suscripción vencida. Realiza el pago para reactivar.
            </p>
          )}

          <div className="space-y-2 rounded-xl border border-border/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Historial de pagos
            </div>
            {loadingPayments ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : payments.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Sin pagos registrados.</p>
            ) : (
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
                    <span className="font-medium text-foreground">{p.currency_id || "S/"} {Number(p.transaction_amount || 0).toFixed(2)}</span>
                    <span className="text-muted-foreground">{new Date(p.date_created || p.created_at || "").toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" /> Estado de suscripción
            </div>
            <p className="text-sm text-muted-foreground">
              {vencido ? "Tu suscripción ha vencido. Realiza el pago para reactivar." : "Tu plan se renueva mensualmente de forma manual."}
            </p>
            <Button
              className="w-full gap-1.5"
              disabled={!canPay || renewalMutation.isPending}
              onClick={() => renewalMutation.mutate()}
            >
              {renewalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Pagar renovación
            </Button>
            {!canPay && diasParaVencer !== null && (
              <p className="text-center text-[11px] text-muted-foreground">Habilitado 5 días antes del vencimiento.</p>
            )}
            {renewalMutation.isError && (
              <p className="text-center text-xs text-destructive">{(renewalMutation.error as Error)?.message}</p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ArrowRightLeft className="h-3.5 w-3.5" /> Cambio de plan
              </div>
              {!showPlanChange && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowPlanChange(true)}>Solicitar</Button>
              )}
            </div>
            {showPlanChange && (
              <div className="space-y-2">
                <Select value={targetPlan || undefined} onValueChange={setTargetPlan}>
                  <SelectTrigger><SelectValue placeholder="Selecciona el plan destino" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Cuéntanos por qué deseas cambiar de plan…" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowPlanChange(false); setTargetPlan(""); setReason(""); }}>Cancelar</Button>
                  <Button
                    size="sm"
                    disabled={!targetPlan || !reason.trim() || planChangeMutation.isPending}
                    onClick={() => { setPlanChangeMsg(null); planChangeMutation.mutate(); }}
                  >
                    {planChangeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enviar solicitud
                  </Button>
                </div>
              </div>
            )}
            {planChangeMsg && <p className="text-xs text-muted-foreground">{planChangeMsg}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getExpressPlans, getExpressSubscriptionStatus, subscribeToExpressPlan, renewExpressSubscription } from "../api/express";
import type { ExpressPlan } from "../types";

export default function ExpressSubscriptionPage() {
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["express-plans"],
    queryFn: getExpressPlans,
  });
  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ["express-subscription-status"],
    queryFn: getExpressSubscriptionStatus,
  });

  const redirectToCheckout = (initPoint?: string) => {
    if (initPoint) window.location.href = initPoint;
    else toast.error("No se recibió el enlace de pago.");
  };

  const subscribe = useMutation({
    mutationFn: (plan_id: number) => subscribeToExpressPlan(plan_id),
    onSuccess: (res) => redirectToCheckout(res.init_point),
    onError: () => toast.error("No se pudo iniciar la suscripción"),
    onSettled: () => setProcessingPlanId(null),
  });

  const renew = useMutation({
    mutationFn: (plan_id: number) => renewExpressSubscription(plan_id),
    onSuccess: (res) => redirectToCheckout(res.init_point),
    onError: () => toast.error("No se pudo iniciar la renovación"),
    onSettled: () => setProcessingPlanId(null),
  });

  const handleAction = (plan: ExpressPlan, isCurrent: boolean) => {
    setProcessingPlanId(plan.id);
    if (isCurrent && status?.canRenew) renew.mutate(plan.id);
    else subscribe.mutate(plan.id);
  };

  if (loadingPlans || loadingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const urgent = status?.status === "active" && status.daysRemaining <= 5;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-foreground">Suscripción</h1>

      {status?.status === "active" ? (
        <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${urgent ? "border-amber-500/40 bg-amber-500/10 text-amber-500" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"}`}>
          {urgent ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>
            Plan <strong>{status.plan}</strong> activo · vence en {status.daysRemaining} día{status.daysRemaining === 1 ? "" : "s"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{status?.status === "pending" ? "Tu cuenta está pendiente de activación." : "Tu suscripción ha expirado."}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={status?.plan_id === plan.id}
            canRenew={!!status?.canRenew}
            isProcessing={processingPlanId === plan.id}
            onAction={() => handleAction(plan, status?.plan_id === plan.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan, isCurrent, canRenew, isProcessing, onAction,
}: { plan: ExpressPlan; isCurrent: boolean; canRenew: boolean; isProcessing: boolean; onAction: () => void }) {
  const label = isCurrent && canRenew ? "Renovar" : isCurrent ? "Plan actual" : "Suscribirse";
  return (
    <Card className={isCurrent ? "border-amber-500/50" : ""}>
      <CardContent className="flex flex-col gap-2 p-4">
        <p className="text-sm font-semibold text-foreground">{plan.name}</p>
        <p className="text-2xl font-bold text-amber-500">S/ {Number(plan.price).toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{plan.duration_days} días</p>
        <Button
          className="mt-2 w-full"
          variant={isCurrent && !canRenew ? "outline" : "default"}
          disabled={(isCurrent && !canRenew) || isProcessing}
          onClick={onAction}
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
        </Button>
      </CardContent>
    </Card>
  );
}

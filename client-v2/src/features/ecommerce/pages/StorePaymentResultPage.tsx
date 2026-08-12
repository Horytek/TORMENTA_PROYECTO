import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncStoreOrderPayment } from "../api/ecommerce";

export default function StorePaymentResultPage() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const statusParam = params.get("status") || "pending";
  const orden = params.get("orden");
  const paymentId = params.get("payment_id") || params.get("collection_id") || undefined;

  const [syncing, setSyncing] = useState(Boolean(orden && statusParam === "success"));
  const [confirmed, setConfirmed] = useState(false);
  const [fulfillment, setFulfillment] = useState<string | null>(null);

  let pickup: { sucursal?: string; direccion?: string } | null = null;
  try {
    const raw = sessionStorage.getItem(`ecom-pickup-${slug}`);
    if (raw) pickup = JSON.parse(raw);
  } catch {
    pickup = null;
  }

  useEffect(() => {
    if (!slug || !orden) return;
    if (statusParam !== "success" && statusParam !== "pending") return;

    let cancelled = false;
    setSyncing(true);
    syncStoreOrderPayment(slug, orden, {
      payment_id: paymentId,
      collection_id: params.get("collection_id") || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        const ef = res?.data?.estado_fulfillment;
        const est = res?.data?.estado;
        setFulfillment(ef || null);
        if (est === "approved" || ef === "pago_confirmado") {
          setConfirmed(true);
        }
      })
      .catch(() => {
        /* el webhook puede confirmar después */
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, orden, statusParam, paymentId, params]);

  const effectiveStatus = confirmed
    ? "success"
    : statusParam === "success" || statusParam === "failure" || statusParam === "pending"
      ? statusParam
      : "pending";

  const map = {
    success: {
      icon: CheckCircle2,
      title: confirmed ? "Pago confirmado" : "Pago recibido",
      body: confirmed
        ? "Tu pedido quedó confirmado. Ya puedes verlo en Mis pedidos."
        : syncing
          ? "Estamos confirmando el cobro con Mercado Pago…"
          : "Tu pedido fue registrado. Si el estado tarda, se actualizará en unos segundos.",
      color: "text-teal-700",
    },
    failure: {
      icon: XCircle,
      title: "Pago no completado",
      body: "Puedes volver al carrito e intentarlo de nuevo.",
      color: "text-red-600",
    },
    pending: {
      icon: Clock,
      title: "Pago pendiente",
      body: syncing
        ? "Consultando estado en Mercado Pago…"
        : "Te avisaremos cuando Mercado Pago confirme el cobro.",
      color: "text-amber-700",
    },
  } as const;

  const viewKey =
    effectiveStatus === "success"
      ? "success"
      : effectiveStatus === "failure"
        ? "failure"
        : "pending";
  const view = map[viewKey];
  const Icon = syncing && viewKey !== "failure" ? Loader2 : view.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-4">
      <div className="max-w-md w-full rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <Icon
          className={`size-12 mx-auto ${view.color} ${syncing && viewKey !== "failure" ? "animate-spin" : ""}`}
        />
        <h1 className="text-xl font-semibold mt-4">{view.title}</h1>
        <p className="text-sm text-stone-600 mt-2">{view.body}</p>
        {orden && <p className="text-xs text-stone-400 mt-3">Orden {orden}</p>}
        {fulfillment && (
          <p className="text-xs text-stone-500 mt-1">Estado: {fulfillment.replaceAll("_", " ")}</p>
        )}
        {pickup?.direccion && (
          <div className="mt-4 text-left rounded-xl bg-stone-50 border border-stone-200 p-4">
            <div className="flex gap-2 items-start">
              <MapPin className="size-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{pickup.sucursal || "Recojo en tienda"}</p>
                <p className="text-xs text-stone-600 mt-1">{pickup.direccion}</p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-2">
          {(viewKey === "success" || confirmed) && (
            <Button asChild variant="default">
              <Link to={`/tienda/${slug}/cuenta/pedidos`}>Ver mis pedidos</Link>
            </Button>
          )}
          <Button asChild variant={viewKey === "success" || confirmed ? "outline" : "default"}>
            <Link to={`/tienda/${slug}`}>Volver a la tienda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

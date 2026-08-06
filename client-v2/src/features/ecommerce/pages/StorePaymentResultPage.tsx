import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StorePaymentResultPage() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const status = params.get("status") || "pending";
  const orden = params.get("orden");

  const map = {
    success: {
      icon: CheckCircle2,
      title: "Pago recibido",
      body: "Tu pedido fue registrado. El comercio confirmará el envío.",
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
      body: "Te avisaremos cuando Mercado Pago confirme el cobro.",
      color: "text-amber-700",
    },
  } as const;

  const view = map[status as keyof typeof map] || map.pending;
  const Icon = view.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-4">
      <div className="max-w-md w-full rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <Icon className={`size-12 mx-auto ${view.color}`} />
        <h1 className="text-xl font-semibold mt-4">{view.title}</h1>
        <p className="text-sm text-stone-600 mt-2">{view.body}</p>
        {orden && <p className="text-xs text-stone-400 mt-3">Orden {orden}</p>}
        <Button asChild className="mt-6">
          <Link to={`/tienda/${slug}`}>Volver a la tienda</Link>
        </Button>
      </div>
    </div>
  );
}

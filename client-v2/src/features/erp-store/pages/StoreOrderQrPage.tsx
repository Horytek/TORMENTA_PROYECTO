import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { buyerGetPedido } from "../api/erpStore";
import { PickupQrDisplay } from "../components/vitrina/PickupQrDisplay";
import { StorefrontAuthGuard } from "../components/vitrina/StorefrontAuthGuard";
import { Button } from "@/components/ui/button";
// notifyPickupReady (buyerOrderStatus) — stub futuro WhatsApp/email/push

/** Pantalla dedicada de mostrador: QR grande + código legible. */
function StoreOrderQrInner() {
  const { slug = "", id = "" } = useParams();
  const id_orden = Number(id);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-pedido", slug, id_orden],
    queryFn: () => buyerGetPedido(slug, id_orden),
    enabled: Boolean(slug && id_orden),
  });
  const pedido = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center store-muted bg-white">
        Cargando…
      </div>
    );
  }

  if (!pedido || pedido.estado_fulfillment !== "listo_recoger" || !pedido.qr_payload) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 bg-white text-center">
        <p className="text-stone-600">Este pedido no está listo para mostrar el QR.</p>
        <Button asChild variant="outline">
          <Link to={`/s/${slug}/cuenta/pedidos/${id_orden}`}>Volver al pedido</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pickup-qr-screen min-h-[100dvh] flex flex-col bg-white text-stone-900 safe-area-pad">
      <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <p className="text-sm font-medium text-stone-500">Pedido listo</p>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-10"
          onClick={() => navigate(`/s/${slug}/cuenta/pedidos/${id_orden}`)}
        >
          Cerrar
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10 gap-5">
        <h1 className="text-2xl font-semibold tracking-tight">Pedido listo</h1>
        <p className="text-sm text-stone-500 text-center max-w-xs">
          Presenta este código al recoger
        </p>

        <PickupQrDisplay
          payload={pedido.qr_payload}
          codigo={pedido.codigo_retiro_visible || pedido.codigo_retiro}
          size={300}
          hint={false}
        />

        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-wider text-stone-400">Pedido</p>
          <p className="font-mono text-lg font-semibold">{pedido.codigo}</p>
        </div>

        {pedido.sucursal_nombre && (
          <p className="text-sm text-stone-600 text-center">
            Sucursal: <span className="font-medium">{pedido.sucursal_nombre}</span>
          </p>
        )}
      </main>

      <style>{`
        .pickup-qr-screen {
          /* Intento de max-brightness en pantallas compatibles (sin APIs nativas) */
          color-scheme: only light;
        }
        @supports (filter: brightness(1)) {
          .pickup-qr-screen .bg-white { filter: brightness(1.05); }
        }
      `}</style>
    </div>
  );
}

export default function StoreOrderQrPage() {
  return (
    <StorefrontAuthGuard>
      <StoreOrderQrInner />
    </StorefrontAuthGuard>
  );
}

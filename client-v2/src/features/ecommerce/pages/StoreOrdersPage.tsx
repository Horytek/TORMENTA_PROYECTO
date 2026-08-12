import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QrCode } from "lucide-react";
import { buyerListPedidos } from "../api/ecommerce";
import { formatPen } from "../types/storefront";
import { Button } from "@/components/ui/button";
import {
  BUYER_BADGE_CLASS,
  buyerBadgeFromFulfillment,
} from "../utils/buyerOrderStatus";
import { cn } from "@/lib/utils";

export default function StoreOrdersPage() {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["buyer-pedidos", slug],
    queryFn: () => buyerListPedidos(slug),
  });
  const pedidos = data?.data || [];

  if (isLoading) return <p className="store-muted">Cargando pedidos…</p>;

  if (!pedidos.length) {
    return (
      <div className="text-center py-12 store-muted">
        <p>Aún no tienes pedidos.</p>
        <Link to={`/tienda/${slug}`} className="text-[var(--vitrina-accent)] font-medium mt-2 inline-block">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pedidos.map((p: Record<string, unknown>) => {
        const ef = String(p.estado_fulfillment || "");
        const listo = ef === "listo_recoger";
        const badge = buyerBadgeFromFulfillment(ef);

        return (
          <li key={String(p.id_orden)}>
            <div
              className={cn(
                "vitrina-card border store-hairline p-4 bg-[var(--vitrina-elevated)]",
                listo && "border-[var(--vitrina-accent)] ring-1 ring-[var(--vitrina-accent)]/30"
              )}
            >
              <Link
                to={`/tienda/${slug}/cuenta/pedidos/${p.id_orden}`}
                className="block hover:opacity-90 transition-opacity"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{String(p.codigo)}</p>
                    <span
                      className={cn(
                        "inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-md",
                        BUYER_BADGE_CLASS[badge.kind]
                      )}
                    >
                      {badge.label}
                    </span>
                    {Boolean(p.sucursal_nombre) && (
                      <p className="text-xs store-muted mt-2">
                        Sucursal: {String(p.sucursal_nombre)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold" style={{ color: "var(--vitrina-accent)" }}>
                      {formatPen(Number(p.total))}
                    </p>
                    <p className="text-xs store-muted mt-1">
                      {new Date(String(p.created_at)).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                </div>
              </Link>

              {listo && (
                <Button asChild className="w-full min-h-12 mt-4 text-base">
                  <Link to={`/tienda/${slug}/cuenta/pedidos/${p.id_orden}/qr`}>
                    <QrCode className="size-5 mr-2" />
                    Mostrar QR
                  </Link>
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

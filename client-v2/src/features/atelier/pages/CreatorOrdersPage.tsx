import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAtelierCreatorOrders } from "@/features/platform/api/atelier";
import { ATELIER_COPY } from "../copy";
import { atelierApiError, formatMoneyPair } from "../helpers";
import { ATELIER_ROUTES } from "../tokens";
import type { AtelierOrder } from "../types";
import { AtelierButton } from "../components/AtelierButton";
import { EmptyState } from "../components/EmptyState";
import { AtelierProductFrame } from "../components/ProductFrame";
import { CommissionLabel, StatusBadge } from "../components/StatusBadge";

/** Lista de encargos del artista (no el home). */
export default function CreatorOrdersPage() {
  const [orders, setOrders] = useState<AtelierOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void listAtelierCreatorOrders()
      .then((r) => {
        setOrders(r.data || []);
        setError("");
      })
      .catch((e) => setError(atelierApiError(e, ATELIER_COPY.processInterrupted)));
  }, []);

  return (
    <AtelierProductFrame requireRole="creador">
      <main className="at-desk-wrap">
        <p className="at-eyebrow">Encargos</p>
        <h1 className="at-display mt-3 text-4xl">Obra en curso y entregada</h1>
        {error ? (
          <EmptyState tone="error" body={error} className="px-0" />
        ) : !orders.length ? (
          <EmptyState
            className="px-0"
            title="Aún no hay encargos"
            body="Cuando un cliente acepte tu propuesta, el encargo vive aquí."
            action={
              <AtelierButton asChild>
                <Link to={ATELIER_ROUTES.creatorBoard}>Ir al tablero</Link>
              </AtelierButton>
            }
          />
        ) : (
          <div className="at-card-grid mt-10">
            {orders.map((o) => (
              <Link
                key={o.id_order}
                to={ATELIER_ROUTES.creatorOrder(o.id_order)}
                className="at-focus block border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-5 py-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <CommissionLabel id={o.id_order} />
                  <StatusBadge estado={o.estado} />
                </div>
                <p className="at-display mt-3 text-2xl">{o.titulo}</p>
                <p className="at-ui mt-1 text-[13px] text-[var(--at-stone)]">
                  {o.cliente} · {formatMoneyPair(o.gross_amount)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </AtelierProductFrame>
  );
}

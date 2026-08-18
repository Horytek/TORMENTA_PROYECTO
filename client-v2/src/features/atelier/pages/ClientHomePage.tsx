import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listAtelierClientOrders,
  listAtelierClientRequests,
} from "@/features/platform/api/atelier";
import { useAtelierAccount } from "../account";
import { ATELIER_COPY, formatCommissionId } from "../copy";
import { atelierApiError, atelierGreeting, formatMoneyPair } from "../helpers";
import { ATELIER_ROUTES } from "../tokens";
import type { AtelierOrder, AtelierQuote, AtelierRequest } from "../types";
import { AtelierButton } from "../components/AtelierButton";
import { EmptyState } from "../components/EmptyState";
import { PaperSkeleton } from "../components/PaperSkeleton";
import { AtelierProductFrame } from "../components/ProductFrame";
import { CommissionLabel, StatusBadge } from "../components/StatusBadge";

const ACTIVE_ORDER = new Set([
  "payment_pending",
  "paid",
  "in_progress",
  "preview",
  "revision",
  "final_delivery",
]);

function nextForOrder(o: AtelierOrder) {
  if (o.estado === "payment_pending") return "Pagar el encargo";
  if (o.estado === "preview") return "El boceto espera tu mirada";
  if (o.estado === "final_delivery") return "La obra está lista";
  if (o.estado === "revision") return "El artista ajusta el trazo";
  if (o.estado === "in_progress" || o.estado === "paid") return "La obra está en el atril";
  return "Continuar el encargo";
}

export default function ClientHomePage() {
  const { me } = useAtelierAccount();
  const [orders, setOrders] = useState<AtelierOrder[]>([]);
  const [requests, setRequests] = useState<AtelierRequest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([listAtelierClientOrders(), listAtelierClientRequests()])
      .then(([o, r]) => {
        setOrders(o.data || []);
        setRequests(r.data || []);
        setError("");
      })
      .catch((e) => setError(atelierApiError(e, ATELIER_COPY.processInterrupted)))
      .finally(() => setLoading(false));
  }, []);

  const inProgress = orders.filter((x) => ACTIVE_ORDER.has(x.estado));
  const openBriefs = requests.filter((x) => ["submitted", "quote_sent"].includes(x.estado));
  const featured = inProgress[0];
  const name = me?.nombre?.split(" ")[0] || "";

  const attention: { to: string; title: string; body: string }[] = [];
  for (const r of openBriefs) {
    const sent = (r.quotes || []).filter((q: AtelierQuote) => q.estado === "sent");
    if (sent.length) {
      attention.push({
        to: ATELIER_ROUTES.clientRequest(r.id_request),
        title: `${sent.length} propuesta${sent.length === 1 ? "" : "s"} por revisar`,
        body: r.titulo,
      });
    }
  }
  for (const o of inProgress) {
    if (o.estado === "preview") {
      attention.push({ to: ATELIER_ROUTES.clientOrder(o.id_order), title: "Boceto esperando aprobación", body: o.titulo || "" });
    } else if (o.estado === "payment_pending") {
      attention.push({ to: ATELIER_ROUTES.clientOrder(o.id_order), title: "Pago pendiente", body: o.titulo || "" });
    } else if (o.estado === "final_delivery") {
      attention.push({ to: ATELIER_ROUTES.clientOrder(o.id_order), title: "Obra lista para aceptar", body: o.titulo || "" });
    }
  }

  return (
    <AtelierProductFrame requireRole="cliente">
      <main className="at-desk-wrap">
        <div className="at-home-split">
          <header className="at-sala-hero">
            <p className="at-eyebrow">{ATELIER_COPY.privateCommission}</p>
            <h1 className="at-display at-sala-hello mt-3">
              {atelierGreeting()}{name ? `, ${name}` : ""}.
            </h1>
            <p className="at-ui mt-4 max-w-lg text-[16px] leading-relaxed text-[var(--at-stone)]">
              ¿Qué quieres crear hoy?
            </p>
            <AtelierButton className="mt-8" asChild>
              <Link to={ATELIER_ROUTES.commission}>{ATELIER_COPY.ctaCommission}</Link>
            </AtelierButton>
          </header>

          {loading ? (
            <PaperSkeleton />
          ) : error ? (
            <EmptyState tone="error" body={error} className="px-0" />
          ) : featured ? (
            <Link to={ATELIER_ROUTES.clientOrder(featured.id_order)} className="at-focus at-marco-piece">
              <div className="flex flex-wrap items-center gap-2">
                <CommissionLabel id={featured.id_order} />
                <StatusBadge estado={featured.estado} />
              </div>
              <p className="at-display mt-4 text-3xl md:text-4xl">{featured.titulo}</p>
              <p className="at-ui mt-2 text-[14px] text-[var(--at-stone)]">
                {featured.nombre_artistico} · {formatMoneyPair(featured.gross_amount)}
              </p>
              <p className="at-eyebrow mt-6">{nextForOrder(featured)}</p>
            </Link>
          ) : !inProgress.length && !openBriefs.length ? (
            <EmptyState
              className="px-0"
              title="Todavía no has creado ningún encargo."
              body="Tu próxima obra puede comenzar aquí."
              action={
                <AtelierButton asChild>
                  <Link to={ATELIER_ROUTES.commission}>{ATELIER_COPY.ctaCommission}</Link>
                </AtelierButton>
              }
            />
          ) : (
            <div />
          )}
        </div>

        {loading || error ? null : !inProgress.length && !openBriefs.length ? null : (
          <>
            {attention.length ? (
              <section className="at-attention">
                <h2 className="at-eyebrow">Requiere tu atención</h2>
                {attention.map((a) => (
                  <Link key={a.to + a.title} to={a.to} className="at-focus at-attention-item">
                    <span className="at-display text-xl">{a.title}</span>
                    <span className="at-ui text-[13px] text-[var(--at-stone)]">{a.body}</span>
                  </Link>
                ))}
              </section>
            ) : null}

            {inProgress.length > 1 ? (
              <section className="mt-12">
                <h2 className="at-eyebrow">En el atril</h2>
                <div className="at-card-grid mt-4">
                  {inProgress.slice(1).map((o) => (
                    <Link
                      key={o.id_order}
                      to={ATELIER_ROUTES.clientOrder(o.id_order)}
                      className="at-focus block border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-5 py-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <CommissionLabel id={o.id_order} />
                        <StatusBadge estado={o.estado} />
                      </div>
                      <p className="at-display mt-2 text-2xl">{o.titulo}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {openBriefs.length ? (
              <section className="mt-12">
                <h2 className="at-eyebrow">Briefs abiertos</h2>
                <div className="at-card-grid mt-4">
                  {openBriefs.map((r) => {
                    const sent = (r.quotes || []).filter((q: AtelierQuote) => q.estado === "sent");
                    return (
                      <Link
                        key={r.id_request}
                        to={ATELIER_ROUTES.clientRequest(r.id_request)}
                        className="at-focus block border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-5 py-5"
                      >
                        <p className="at-eyebrow">{formatCommissionId(r.id_request)}</p>
                        <p className="at-display mt-2 text-2xl">{r.titulo}</p>
                        <p className="at-ui mt-1 text-[13px] text-[var(--at-stone)]">
                          {sent.length
                            ? `${sent.length} propuesta${sent.length === 1 ? "" : "s"}`
                            : "Esperando el trazo de un artista"}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </AtelierProductFrame>
  );
}

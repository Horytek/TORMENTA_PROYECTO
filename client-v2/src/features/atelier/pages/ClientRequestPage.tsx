import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  acceptAtelierQuote,
  getAtelierClientRequest,
  rejectAtelierQuote,
} from "@/features/platform/api/atelier";
import { ATELIER_COPY } from "../copy";
import { atelierApiError, formatMoneyPair, parseBrief } from "../helpers";
import { ATELIER_ROUTES } from "../tokens";
import type { AtelierQuote, AtelierRequest } from "../types";
import { AtelierButton } from "../components/AtelierButton";
import { EmptyState } from "../components/EmptyState";
import { AtelierProductFrame } from "../components/ProductFrame";
import { feeLine, PrivateFileCard } from "../components/PrivateFileCard";
import { StatusBadge } from "../components/StatusBadge";

export default function ClientRequestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const requestId = Number(id);
  const [brief, setBrief] = useState<AtelierRequest | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    if (!requestId) return;
    void getAtelierClientRequest(requestId)
      .then((r) => {
        setBrief(r.data || null);
        setError("");
      })
      .catch((e) => {
        setBrief(null);
        setError(atelierApiError(e, ATELIER_COPY.processInterrupted));
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const accept = (quote: AtelierQuote) => {
    setBusy(quote.id_quote);
    void acceptAtelierQuote(quote.id_quote)
      .then((r) => {
        const orderId = r?.data?.id_order;
        if (orderId) navigate(ATELIER_ROUTES.clientOrder(orderId));
        else load();
      })
      .catch((e) => setError(atelierApiError(e, ATELIER_COPY.processInterrupted)))
      .finally(() => setBusy(null));
  };

  const reject = (quote: AtelierQuote) => {
    setBusy(quote.id_quote);
    void rejectAtelierQuote(quote.id_quote, { cancel_request: false })
      .then(load)
      .catch((e) => setError(atelierApiError(e, ATELIER_COPY.processInterrupted)))
      .finally(() => setBusy(null));
  };

  const quotes = (brief?.quotes || []) as AtelierQuote[];
  const sent = quotes.filter((q) => q.estado === "sent");
  const meta = parseBrief(brief?.brief_json);

  return (
    <AtelierProductFrame requireRole="cliente">
      <main className="at-desk-wrap">
        {error && !brief ? (
          <EmptyState tone="error" body={error} actionLabel="Volver" onAction={() => navigate(ATELIER_ROUTES.clientHome)} />
        ) : !brief ? (
          <p className="at-ui text-[var(--at-stone)]">Abriendo el brief…</p>
        ) : (
          <>
            <div className="at-split-2 mt-10">
              <div>
                <p className="at-eyebrow">
                  {brief.abierta ? ATELIER_COPY.openBoard : ATELIER_COPY.directedBrief}
                </p>
                <h1 className="at-display mt-3 text-4xl">{brief.titulo}</h1>
                <p className="at-ui mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{brief.descripcion}</p>
                {meta ? (
                  <p className="at-ui mt-3 text-[13px] text-[var(--at-stone)]">
                    {[meta.estilo, meta.formato, meta.uso].filter(Boolean).join(" · ")}
                    {meta.presupuesto_max
                      ? ` · ${formatMoneyPair(meta.presupuesto_min)} — ${formatMoneyPair(meta.presupuesto_max)}`
                      : ""}
                  </p>
                ) : null}

                {brief.files?.length ? (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {brief.files.map((f) => (
                      <PrivateFileCard key={f.id_file} file={f} role="cliente" />
                    ))}
                  </div>
                ) : null}
              </div>

              <section className="space-y-4">
                <h2 className="at-display text-2xl">Propuestas</h2>
              {!sent.length ? (
                <p className="at-ui text-[15px] text-[var(--at-stone)]">
                  Todavía no hay propuestas. El brief sigue abierto.
                </p>
              ) : (
                sent.map((q) => (
                  <article
                    key={q.id_quote}
                    className="border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-5 py-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="at-display text-xl">{q.nombre_artistico || "Artista"}</p>
                      <StatusBadge estado={q.estado} kind="quote" />
                    </div>
                    <p className="at-display mt-3 text-3xl">{formatMoneyPair(q.gross_amount)}</p>
                    <p className="at-ui mt-1 text-[12px] text-[var(--at-stone)]">
                      {feeLine(q.gross_amount, q.platform_fee, q.creator_net)}
                    </p>
                    <p className="at-ui mt-3 text-[14px] text-[var(--at-ink)]">
                      {q.dias_entrega} días · {q.revisiones ?? 0} revisiones
                    </p>
                    {q.condiciones ? (
                      <p className="at-ui mt-2 text-[14px] leading-relaxed text-[var(--at-stone)]">
                        Incluye: {q.condiciones}
                      </p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-2 max-md:sticky max-md:bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] max-md:z-20 max-md:bg-[var(--at-offwhite)] max-md:py-3">
                      <AtelierButton
                        disabled={busy === q.id_quote}
                        onClick={() => accept(q)}
                      >
                        {ATELIER_COPY.acceptProposal(formatMoneyPair(q.gross_amount))}
                      </AtelierButton>
                      <AtelierButton
                        variant="tertiary"
                        disabled={busy === q.id_quote}
                        onClick={() => reject(q)}
                      >
                        {ATELIER_COPY.rejectProposal}
                      </AtelierButton>
                    </div>
                  </article>
                ))
              )}
            </section>
            </div>

            {error ? (
              <p role="alert" className="at-ui mt-6 text-[14px] text-[var(--at-accent)]">
                {error}
              </p>
            ) : null}

            <p className="mt-10">
              <AtelierButton variant="tertiary" asChild>
                <Link to={ATELIER_ROUTES.clientHome}>Volver a Tu Atelier</Link>
              </AtelierButton>
            </p>
          </>
        )}
      </main>
    </AtelierProductFrame>
  );
}

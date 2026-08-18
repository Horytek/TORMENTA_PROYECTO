import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAtelierWallet,
  listAtelierCreatorBoard,
  listAtelierCreatorOrders,
} from "@/features/platform/api/atelier";
import { useAtelierAccount } from "../account";
import { ATELIER_COPY } from "../copy";
import { atelierApiError, atelierGreeting, formatMoneyPair } from "../helpers";
import { ATELIER_ROUTES } from "../tokens";
import type { AtelierOrder, AtelierRequest } from "../types";
import { AtelierButton } from "../components/AtelierButton";
import { EmptyState } from "../components/EmptyState";
import { PaperSkeleton } from "../components/PaperSkeleton";
import { AtelierProductFrame } from "../components/ProductFrame";
import { CommissionLabel, StatusBadge } from "../components/StatusBadge";

const ACTIVE = new Set([
  "payment_pending",
  "paid",
  "in_progress",
  "preview",
  "revision",
  "final_delivery",
]);

export default function StudioHomePage() {
  const { me } = useAtelierAccount();
  const [orders, setOrders] = useState<AtelierOrder[]>([]);
  const [board, setBoard] = useState<AtelierRequest[]>([]);
  const [wallet, setWallet] = useState<{ pending?: number; available?: number; total_earned?: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([listAtelierCreatorOrders(), listAtelierCreatorBoard(), getAtelierWallet()])
      .then(([o, b, w]) => {
        setOrders(o.data || []);
        setBoard(b.data || []);
        setWallet(w.data || null);
        setError("");
      })
      .catch((e) => setError(atelierApiError(e, ATELIER_COPY.processInterrupted)))
      .finally(() => setLoading(false));
  }, []);

  const inProgress = orders.filter((o) => ACTIVE.has(o.estado));
  const current = inProgress[0];
  const revision = inProgress.filter((o) => o.estado === "preview" || o.estado === "revision").length;
  const openBoard = board.filter((x) => !x.my_quote_id).slice(0, 3);
  const name = me?.profile?.nombre_artistico || me?.nombre?.split(" ")[0] || "";
  const available = me?.profile?.disponible == null ? true : Boolean(me.profile.disponible);

  return (
    <AtelierProductFrame requireRole="creador">
      <main className="at-desk-wrap">
        <div className="at-home-split">
          <header>
            <p className="at-eyebrow">Atril</p>
            <h1 className="at-display at-sala-hello mt-3">
              {atelierGreeting()}{name ? `, ${name}` : ""}.
            </h1>
            <p className="at-ui mt-4 max-w-lg text-[16px] leading-relaxed text-[var(--at-stone)]">
              {available ? "Tu estudio está activo." : "El estudio no acepta encargos nuevos."}
            </p>

            {loading ? (
              <PaperSkeleton />
            ) : error ? (
              <EmptyState tone="error" body={error} className="px-0" />
            ) : (
              <>
                <dl className="at-estudio-counts">
                  <div>
                    <dt className="at-eyebrow">Encargos activos</dt>
                    <dd className="at-display at-estudio-count-n">{inProgress.length}</dd>
                  </div>
                  <div>
                    <dt className="at-eyebrow">Solicitudes nuevas</dt>
                    <dd className="at-display at-estudio-count-n">{board.filter((x) => !x.my_quote_id).length}</dd>
                  </div>
                  <div>
                    <dt className="at-eyebrow">En revisión</dt>
                    <dd className="at-display at-estudio-count-n">{revision}</dd>
                  </div>
                  <div>
                    <dt className="at-eyebrow">Por recibir</dt>
                    <dd className="at-display at-estudio-count-n">{formatMoneyPair(wallet?.pending)}</dd>
                  </div>
                </dl>

                <p className="mt-8 flex flex-wrap gap-3">
                  <AtelierButton asChild>
                    <Link to={ATELIER_ROUTES.creatorBoard}>Abrir el tablero</Link>
                  </AtelierButton>
                  <AtelierButton variant="tertiary" asChild>
                    <Link to={`${ATELIER_ROUTES.studio}/portafolio`}>Agregar obra</Link>
                  </AtelierButton>
                </p>
              </>
            )}
          </header>

          {loading || error ? (
            <div />
          ) : current ? (
            <Link to={ATELIER_ROUTES.creatorOrder(current.id_order)} className="at-focus at-marco-piece">
              <p className="at-eyebrow">Trabajo actual</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CommissionLabel id={current.id_order} />
                <StatusBadge estado={current.estado} />
              </div>
              <p className="at-display mt-4 text-3xl md:text-4xl">{current.titulo}</p>
              <p className="at-ui mt-2 text-[14px] text-[var(--at-stone)]">
                {current.cliente} · {formatMoneyPair(current.gross_amount)}
              </p>
            </Link>
          ) : (
            <EmptyState
              className="px-0"
              title="El atril está libre"
              body="Cuando acepten una propuesta y paguen, el encargo aparece aquí. Mientras tanto, el tablero espera ideas."
              action={
                <AtelierButton asChild>
                  <Link to={ATELIER_ROUTES.creatorBoard}>Ir al tablero</Link>
                </AtelierButton>
              }
            />
          )}
        </div>

        {!loading && !error && openBoard.length ? (
          <section className="mt-12">
            <h2 className="at-eyebrow">Podría encajar con tu estilo</h2>
            <div className="at-card-grid mt-4">
              {openBoard.map((item) => (
                <Link
                  key={item.id_request}
                  to={ATELIER_ROUTES.creatorBrief(item.id_request)}
                  className="at-focus block border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-5 py-5"
                >
                  <p className="at-eyebrow">COMMISSION #{item.id_request}</p>
                  <p className="at-display mt-1 text-2xl">{item.titulo}</p>
                  <p className="at-ui mt-1 text-[13px] text-[var(--at-stone)]">
                    {item.presupuesto ? `Hasta ${formatMoneyPair(item.presupuesto)}` : "Presupuesto a medida"}
                    {item.quotes_sent ? ` · ${item.quotes_sent} propuestas` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </AtelierProductFrame>
  );
}

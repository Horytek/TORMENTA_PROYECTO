import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  getAtelierCreatorRequest,
  listAtelierCreatorBoard,
  sendAtelierQuote,
} from "@/features/platform/api/atelier";
import { ATELIER_COPY } from "../copy";
import { atelierApiError, formatMoneyPair, parseBrief } from "../helpers";
import { ATELIER_ROUTES } from "../tokens";
import type { AtelierRequest } from "../types";
import { AtelierButton } from "../components/AtelierButton";
import { EmptyState } from "../components/EmptyState";
import { AtelierProductFrame } from "../components/ProductFrame";
import { PrivateFileCard } from "../components/PrivateFileCard";
import { StatusBadge } from "../components/StatusBadge";

type BoardFilter = "free" | "mine" | "quoted" | "all";

const FILTERS: { id: BoardFilter; label: string }[] = [
  { id: "free", label: ATELIER_COPY.filterFree },
  { id: "mine", label: ATELIER_COPY.filterDirected },
  { id: "quoted", label: ATELIER_COPY.filterQuoted },
  { id: "all", label: ATELIER_COPY.filterAll },
];

function isLibre(item: AtelierRequest) {
  return item.abierta === true || item.id_creator == null;
}

function matchesFilter(item: AtelierRequest, filter: BoardFilter) {
  const quoted = Boolean(item.my_quote_id);
  if (filter === "quoted") return quoted;
  if (filter === "free") return isLibre(item) && !quoted;
  if (filter === "mine") return !isLibre(item) && !quoted;
  return true;
}

function filterForItem(item: AtelierRequest): BoardFilter {
  if (item.my_quote_id) return "quoted";
  if (isLibre(item)) return "free";
  return "mine";
}

function headingFor(filter: BoardFilter) {
  if (filter === "mine") return { title: ATELIER_COPY.boardDirected, body: ATELIER_COPY.boardDirectedBody };
  if (filter === "quoted") return { title: ATELIER_COPY.boardQuoted, body: ATELIER_COPY.boardQuotedBody };
  if (filter === "all") return { title: ATELIER_COPY.boardAll, body: ATELIER_COPY.boardAllBody };
  return { title: ATELIER_COPY.boardFree, body: ATELIER_COPY.boardFreeBody };
}

function emptyFor(filter: BoardFilter) {
  if (filter === "mine") return { title: ATELIER_COPY.emptyDirected, body: ATELIER_COPY.emptyDirectedBody };
  if (filter === "quoted") return { title: ATELIER_COPY.emptyQuoted, body: ATELIER_COPY.emptyQuotedBody };
  if (filter === "all") return { title: ATELIER_COPY.emptyBoard, body: ATELIER_COPY.emptyBoardBody };
  return { title: ATELIER_COPY.emptyFree, body: ATELIER_COPY.emptyFreeBody };
}

function briefMetaLine(item: AtelierRequest) {
  const meta = parseBrief(item.brief_json);
  const budget =
    meta?.presupuesto_max != null
      ? `hasta ${formatMoneyPair(meta.presupuesto_max)}`
      : item.presupuesto
        ? `hasta ${formatMoneyPair(item.presupuesto)}`
        : "Presupuesto a medida";
  const parts = [meta?.estilo, budget, item.quotes_sent ? `${item.quotes_sent} propuestas` : null].filter(Boolean);
  return parts.join(" · ");
}

function QuoteForm({
  requestId,
  suggested,
  onSent,
}: {
  requestId: number;
  suggested?: number | string | null;
  onSent: () => void;
}) {
  const [precio, setPrecio] = useState(String(Number(suggested) || 120));
  const [dias, setDias] = useState("7");
  const [revisiones, setRevisiones] = useState("2");
  const [incluye, setIncluye] = useState("Entrega digital en alta resolución.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="mt-4 space-y-3 border-t border-[var(--at-hairline)] pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        void sendAtelierQuote(requestId, {
          precio_base: Number(precio),
          dias_entrega: Number(dias),
          revisiones: Number(revisiones),
          condiciones: incluye.trim(),
        })
          .then(onSent)
          .catch((err) => setError(atelierApiError(err, ATELIER_COPY.processInterrupted)))
          .finally(() => setBusy(false));
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="at-eyebrow">Precio (S/)</span>
          <input
            className="at-ui at-focus mt-1 w-full border-b border-[var(--at-hairline)] bg-transparent py-2 outline-none"
            type="number"
            min={1}
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow">Días</span>
          <input
            className="at-ui at-focus mt-1 w-full border-b border-[var(--at-hairline)] bg-transparent py-2 outline-none"
            type="number"
            min={1}
            max={365}
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow">Revisiones</span>
          <input
            className="at-ui at-focus mt-1 w-full border-b border-[var(--at-hairline)] bg-transparent py-2 outline-none"
            type="number"
            min={0}
            max={20}
            value={revisiones}
            onChange={(e) => setRevisiones(e.target.value)}
          />
        </label>
      </div>
      <label className="block">
        <span className="at-eyebrow">Incluye</span>
        <textarea
          className="at-ui at-focus mt-1 min-h-20 w-full border border-[var(--at-hairline)] bg-transparent p-3 text-[14px] outline-none"
          value={incluye}
          onChange={(e) => setIncluye(e.target.value)}
        />
      </label>
      {error ? <p className="at-ui text-[13px] text-[var(--at-accent)]">{error}</p> : null}
      <AtelierButton type="submit" disabled={busy}>
        {busy ? "Enviando…" : `Enviar propuesta de ${formatMoneyPair(precio)}`}
      </AtelierButton>
    </form>
  );
}

function BoardSummary({
  item,
  selected,
  onSelect,
}: {
  item: AtelierRequest;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" className={cn("at-board-item at-focus", selected && "is-on")} onClick={onSelect}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="at-eyebrow text-[var(--at-ink)]">COMMISSION #{item.id_request}</span>
        <StatusBadge estado={item.estado} />
        {isLibre(item) ? (
          <span className="at-eyebrow">{ATELIER_COPY.openBoard}</span>
        ) : (
          <span className="at-eyebrow">{ATELIER_COPY.directedBrief}</span>
        )}
      </div>
      <h2 className="at-display mt-3 text-2xl">{item.titulo}</h2>
      <p className="at-ui mt-2 line-clamp-2 text-[14px] leading-relaxed text-[var(--at-stone)]">{item.descripcion}</p>
      <p className="at-ui mt-3 text-[12px] text-[var(--at-stone)]">
        {[item.cliente, briefMetaLine(item)].filter(Boolean).join(" · ")}
      </p>
    </button>
  );
}

function BoardDetail({ item, onQuoted }: { item: AtelierRequest; onQuoted: () => void }) {
  const [detail, setDetail] = useState<AtelierRequest | null>(null);
  const meta = parseBrief(item.brief_json);
  const already = Boolean(item.my_quote_id);

  useEffect(() => {
    let cancelled = false;
    void getAtelierCreatorRequest(item.id_request)
      .then((r) => {
        if (!cancelled) setDetail(r.data || null);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id_request]);

  return (
    <article className="at-board-detail">
      <p className="at-eyebrow">{isLibre(item) ? ATELIER_COPY.openBoard : ATELIER_COPY.directedBrief}</p>
      <h2 className="at-display mt-2 text-3xl">{item.titulo}</h2>
      <p className="at-ui mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{item.descripcion}</p>
      <p className="at-ui mt-3 text-[13px] text-[var(--at-stone)]">
        {item.cliente}
        {meta?.estilo ? ` · ${meta.estilo}` : ""}
        {meta?.formato ? ` · ${meta.formato}` : ""}
        {meta?.uso ? ` · ${meta.uso}` : ""}
        {meta?.presupuesto_max || item.presupuesto
          ? ` · ${
              meta?.presupuesto_min != null
                ? `${formatMoneyPair(meta.presupuesto_min)} — ${formatMoneyPair(meta.presupuesto_max || item.presupuesto)}`
                : `hasta ${formatMoneyPair(meta?.presupuesto_max || item.presupuesto)}`
            }`
          : ""}
      </p>
      {meta?.caracteristicas ? (
        <p className="at-ui mt-2 text-[14px] text-[var(--at-stone)]">{meta.caracteristicas}</p>
      ) : null}

      {detail?.files?.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {detail.files.map((f) => (
            <PrivateFileCard key={f.id_file} file={f} role="creador" />
          ))}
        </div>
      ) : null}

      {already ? (
        <p className="at-ui mt-6 text-[14px] text-[var(--at-stone)]">
          Propuesta enviada. Esperando respuesta del cliente.
        </p>
      ) : (
        <div className="max-lg:sticky max-lg:bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] max-lg:z-20 max-lg:bg-[var(--at-offwhite)] max-lg:pt-2">
          <QuoteForm key={item.id_request} requestId={item.id_request} suggested={item.presupuesto} onSent={onQuoted} />
        </div>
      )}
    </article>
  );
}

export default function ArtistBoardPage() {
  const { id } = useParams();
  const [items, setItems] = useState<AtelierRequest[]>([]);
  const [filter, setFilter] = useState<BoardFilter>("free");
  const [openId, setOpenId] = useState<number | null>(id ? Number(id) : null);
  const [error, setError] = useState("");

  const load = () => {
    void listAtelierCreatorBoard()
      .then((r) => {
        setItems(r.data || []);
        setError("");
      })
      .catch((e) => setError(atelierApiError(e, ATELIER_COPY.processInterrupted)));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!id || !items.length) return;
    const found = items.find((x) => x.id_request === Number(id));
    if (!found) return;
    setOpenId(found.id_request);
    setFilter(filterForItem(found));
  }, [id, items]);

  const filtered = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [items, filter]);
  const selected = filtered.find((x) => x.id_request === openId) || null;
  const heading = headingFor(filter);
  const empty = emptyFor(filter);

  const select = (requestId: number) => {
    setOpenId((cur) => (cur === requestId ? null : requestId));
  };

  return (
    <AtelierProductFrame requireRole="creador">
      <main className="at-desk-wrap">
        <p className="at-eyebrow">Tablero</p>
        <h1 className="at-display mt-3 text-4xl md:text-5xl">{heading.title}</h1>
        <p className="at-ui mt-3 max-w-lg text-[15px] text-[var(--at-stone)]">{heading.body}</p>

        <nav className="at-board-filters" aria-label="Filtrar solicitudes">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={cn("at-filter at-focus min-h-11", filter === f.id && "is-on")}
              onClick={() => {
                setFilter(f.id);
                setOpenId(null);
              }}
            >
              {f.label}
            </button>
          ))}
        </nav>

        {error ? (
          <EmptyState tone="error" body={error} className="px-0" />
        ) : !items.length ? (
          <EmptyState className="px-0" title={ATELIER_COPY.emptyBoard} body={ATELIER_COPY.emptyBoardBody} />
        ) : !filtered.length ? (
          <EmptyState className="px-0" title={empty.title} body={empty.body} />
        ) : (
          <>
            <div className="mt-8 space-y-3 lg:hidden">
              {filtered.map((item) => (
                <div key={item.id_request}>
                  <BoardSummary
                    item={item}
                    selected={openId === item.id_request}
                    onSelect={() => select(item.id_request)}
                  />
                  {openId === item.id_request ? (
                    <div className="mt-3">
                      <BoardDetail item={item} onQuoted={load} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="at-board-desk hidden lg:grid">
              <div className="space-y-3">
                {filtered.map((item) => (
                  <BoardSummary
                    key={item.id_request}
                    item={item}
                    selected={selected?.id_request === item.id_request}
                    onSelect={() => setOpenId(item.id_request)}
                  />
                ))}
              </div>
              {selected ? (
                <BoardDetail item={selected} onQuoted={load} />
              ) : (
                <p className="at-ui at-board-detail text-[15px] text-[var(--at-stone)]">{ATELIER_COPY.pickBrief}</p>
              )}
            </div>
          </>
        )}

        <p className="mt-10">
          <AtelierButton variant="tertiary" asChild>
            <Link to={ATELIER_ROUTES.studio}>{ATELIER_COPY.yourStudio}</Link>
          </AtelierButton>
        </p>
      </main>
    </AtelierProductFrame>
  );
}

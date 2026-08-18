import { useEffect, useMemo, useRef, useState } from "react";
import {
  checkoutAtelierOrder,
  getAtelierOrder,
  requestAtelierRevision,
  reviewAtelierOrder,
  sendAtelierMessage,
  startAtelierOrder,
  transitionAtelierOrder,
} from "@/features/platform/api/atelier";
import { ATELIER_COPY } from "../copy";
import { atelierApiError, formatMoneyPair, formatSol, parseBrief } from "../helpers";
import type { AtelierFileMeta, AtelierMessage, AtelierOrder } from "../types";
import { uploadAtelierPrivateFile } from "../upload";
import { AtelierButton } from "./AtelierButton";
import { CommissionLabel, StatusBadge } from "./StatusBadge";
import { CommissionTimeline } from "./CommissionTimeline";
import { DeliveryPanel } from "./DeliveryPanel";
import { EmptyState } from "./EmptyState";
import { FileUploader, type AtelierUploadItem } from "./FileUploader";
import { PrivateFileCard } from "./PrivateFileCard";

type Role = "cliente" | "creador";

function filesOf(order: AtelierOrder | null, category?: AtelierFileMeta["category"]) {
  const all = order?.files || [];
  return category ? all.filter((f) => f.category === category) : all;
}

/** Workspace del encargo: timeline, preview firmada, chat, revisiones, entrega. */
export function AtelierWorkspace({
  orderId,
  role,
}: {
  orderId: number;
  role: Role;
}) {
  const [order, setOrder] = useState<AtelierOrder | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<AtelierUploadItem[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const controllers = useRef(new Map<string, AbortController>());

  const load = async () => {
    try {
      const r = await getAtelierOrder(orderId, role);
      setOrder(r.data || null);
      setError("");
    } catch (e) {
      setOrder(null);
      setError(atelierApiError(e, ATELIER_COPY.processInterrupted));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, role]);

  const messages: AtelierMessage[] = order?.messages || [];
  const estado = order?.estado || "";
  const used = Number(order?.revisiones_usadas || 0);
  const included = Number(order?.revisiones_incluidas || 0);
  const revisionsLeft = included - used;
  const brief = parseBrief(order?.brief_json);
  const showDelivery = estado === "final_delivery" || estado === "completed";
  const uploadCategory = estado === "preview" || estado === "final_delivery" ? "delivery" : "sketch";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(atelierApiError(e, ATELIER_COPY.processInterrupted));
    } finally {
      setBusy(false);
    }
  };

  const pay = () =>
    run(async () => {
      const r = await checkoutAtelierOrder(orderId);
      const url = r?.data?.init_point || r?.data?.sandbox_init_point;
      if (url) window.location.assign(url);
      else throw new Error("No se pudo abrir Mercado Pago");
    });

  const sendMsg = () => {
    const body = message.trim();
    if (!body) return;
    void run(async () => {
      await sendAtelierMessage(orderId, { body }, role);
      setMessage("");
    });
  };

  const addFiles = (files: File[]) => {
    const category = uploadCategory === "delivery" ? "delivery" : "sketch";
    for (const file of files) {
      const id = crypto.randomUUID();
      const ac = new AbortController();
      controllers.current.set(id, ac);
      const item: AtelierUploadItem = { id, file, progress: 0, status: "uploading" };
      setUploads((prev) => [...prev, item]);
      void uploadAtelierPrivateFile({
        file,
        category,
        role: "creador",
        id_order: orderId,
        signal: ac.signal,
        onProgress: (pct) =>
          setUploads((prev) => prev.map((x) => (x.id === id ? { ...x, progress: pct } : x))),
      })
        .then(() => {
          controllers.current.delete(id);
          setUploads((prev) => prev.map((x) => (x.id === id ? { ...x, status: "done", progress: 100 } : x)));
          return load();
        })
        .catch((e) => {
          controllers.current.delete(id);
          if ((e as { name?: string }).name === "AbortError") {
            setUploads((prev) => prev.filter((x) => x.id !== id));
            return;
          }
          setUploads((prev) =>
            prev.map((x) =>
              x.id === id ? { ...x, status: "error", error: atelierApiError(e, "No se subió el archivo") } : x,
            ),
          );
        });
    }
  };

  const workFiles = useMemo(
    () => filesOf(order).filter((f) => f.category !== "reference"),
    [order],
  );
  const refs = filesOf(order, "reference");

  const [pane, setPane] = useState<"obra" | "chat" | "archivos" | "brief">("obra");

  if (error && !order) {
    return <EmptyState tone="error" body={error} actionLabel="Reintentar" onAction={() => void load()} />;
  }
  if (!order) {
    return (
      <p className="at-ui px-5 py-16 text-center text-[var(--at-stone)]">Abriendo el encargo…</p>
    );
  }

  const sticky =
    role === "cliente" && estado === "payment_pending" ? (
      <AtelierButton className="w-full" disabled={busy} onClick={() => void pay()}>
        {ATELIER_COPY.payMercadoPago} · {formatMoneyPair(order.gross_amount)}
      </AtelierButton>
    ) : role === "cliente" && estado === "preview" ? (
      <AtelierButton
        className="w-full"
        variant="secondary"
        disabled={busy || revisionsLeft <= 0}
        onClick={() => setPane("obra")}
      >
        {ATELIER_COPY.requestRevision}
      </AtelierButton>
    ) : role === "cliente" && estado === "final_delivery" ? (
      <AtelierButton
        className="w-full"
        disabled={busy}
        onClick={() => void run(() => transitionAtelierOrder(orderId, { estado: "completed" }, "cliente"))}
      >
        {ATELIER_COPY.approveComplete}
      </AtelierButton>
    ) : role === "creador" && estado === "paid" ? (
      <AtelierButton className="w-full" disabled={busy} onClick={() => void run(() => startAtelierOrder(orderId))}>
        {ATELIER_COPY.startArtwork}
      </AtelierButton>
    ) : role === "creador" && (estado === "in_progress" || estado === "revision") ? (
      <AtelierButton
        className="w-full"
        disabled={busy}
        onClick={() => void run(() => transitionAtelierOrder(orderId, { estado: "preview" }, "creador"))}
      >
        {ATELIER_COPY.sendSketch}
      </AtelierButton>
    ) : role === "creador" && estado === "preview" ? (
      <AtelierButton
        className="w-full"
        disabled={busy}
        onClick={() => void run(() => transitionAtelierOrder(orderId, { estado: "final_delivery" }, "creador"))}
      >
        {ATELIER_COPY.presentArtwork}
      </AtelierButton>
    ) : null;

  const obraBlock = (
    <>
      {showDelivery ? (
        <div className="mt-10">
          <DeliveryPanel
            files={order.files || []}
            role={role}
            canApprove={role === "cliente" && estado === "final_delivery"}
            approving={busy}
            onApprove={() =>
              void run(() => transitionAtelierOrder(orderId, { estado: "completed" }, "cliente"))
            }
          />
        </div>
      ) : null}
      {estado === "payment_pending" && role === "cliente" ? (
        <div className="mt-10 border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-5 py-6">
          <p className="at-display text-2xl">Confirma el encargo</p>
          <p className="at-ui mt-2 text-[14px] text-[var(--at-stone)]">
            El pago se hace por Mercado Pago. El artista cobra al completar la obra.
          </p>
          <AtelierButton className="mt-5 hidden lg:inline-flex" disabled={busy} onClick={() => void pay()}>
            {ATELIER_COPY.payMercadoPago} · {formatMoneyPair(order.gross_amount)}
          </AtelierButton>
        </div>
      ) : null}
      {role === "creador" && (estado === "in_progress" || estado === "revision" || estado === "preview") ? (
        <section className="mt-10 space-y-4">
          <FileUploader
            category={uploadCategory}
            items={uploads}
            onFiles={addFiles}
            onCancel={(id) => {
              controllers.current.get(id)?.abort();
              controllers.current.delete(id);
              setUploads((prev) => prev.filter((x) => x.id !== id));
            }}
            label={uploadCategory === "delivery" ? ATELIER_COPY.dropDelivery : "Suelta el boceto aquí"}
            multiple
          />
          <div className="hidden lg:block">
            {estado === "in_progress" || estado === "revision" ? (
              <AtelierButton
                disabled={busy}
                onClick={() => void run(() => transitionAtelierOrder(orderId, { estado: "preview" }, "creador"))}
              >
                {ATELIER_COPY.sendSketch}
              </AtelierButton>
            ) : null}
            {estado === "preview" ? (
              <AtelierButton
                disabled={busy}
                onClick={() =>
                  void run(() => transitionAtelierOrder(orderId, { estado: "final_delivery" }, "creador"))
                }
              >
                {ATELIER_COPY.presentArtwork}
              </AtelierButton>
            ) : null}
          </div>
        </section>
      ) : null}
      {role === "creador" && estado === "paid" ? (
        <div className="mt-10 hidden lg:block">
          <AtelierButton disabled={busy} onClick={() => void run(() => startAtelierOrder(orderId))}>
            {ATELIER_COPY.startArtwork}
          </AtelierButton>
        </div>
      ) : null}
      {role === "cliente" && estado === "preview" ? (
        <section className="mt-10 space-y-3 border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-5 py-5">
          <p className="at-ui text-[13px] text-[var(--at-stone)]">
            Revisiones {used}/{included}
            {revisionsLeft <= 0 ? ` · ${ATELIER_COPY.noRevisionsLeft}` : ""}
          </p>
          <textarea
            className="at-ui at-focus min-h-24 w-full border border-[var(--at-hairline)] bg-transparent p-3 text-[14px] outline-none"
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="Qué ajustar: color, encuadre, un detalle…"
            disabled={revisionsLeft <= 0}
          />
          <AtelierButton
            variant="secondary"
            disabled={busy || revisionsLeft <= 0 || revisionNote.trim().length < 1}
            onClick={() =>
              void run(async () => {
                await requestAtelierRevision(orderId, { comentario: revisionNote.trim() });
                setRevisionNote("");
              })
            }
          >
            {ATELIER_COPY.requestRevision}
          </AtelierButton>
        </section>
      ) : null}
      {workFiles.length && !showDelivery ? (
        <section className="mt-12 space-y-4">
          <h2 className="at-display text-2xl">La obra en proceso</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {workFiles.map((f) => (
              <PrivateFileCard key={f.id_file} file={f} role={role} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );

  const chatBlock = (
    <section className="space-y-4">
      <h2 className="at-display hidden text-2xl lg:block">Conversación</h2>
      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id_message} className="border-b border-[var(--at-hairline)] pb-3">
            <p className="at-eyebrow text-[10px]">{m.nombre || "Alguien"}</p>
            <p className="at-ui mt-1 text-[15px] leading-relaxed">{m.body}</p>
          </li>
        ))}
      </ul>
      {estado !== "completed" && estado !== "cancelled" ? (
        <div className="flex gap-2">
          <input
            className="at-ui at-focus min-h-11 flex-1 border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-3 text-[14px] outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe al otro lado del encargo…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMsg();
              }
            }}
          />
          <AtelierButton disabled={busy || !message.trim()} onClick={sendMsg}>
            Enviar
          </AtelierButton>
        </div>
      ) : null}
    </section>
  );

  const filesBlock = (
    <section className="space-y-4">
      <h2 className="at-display hidden text-2xl lg:block">Archivos</h2>
      {refs.length ? (
        <>
          <p className="at-eyebrow">Referencias</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {refs.map((f) => (
              <PrivateFileCard key={f.id_file} file={f} role={role} />
            ))}
          </div>
        </>
      ) : (
        <p className="at-ui text-[14px] text-[var(--at-stone)]">Sin referencias en este encargo.</p>
      )}
    </section>
  );

  const briefBlock = (
    <section>
      <h2 className="at-eyebrow">Brief</h2>
      {order.descripcion ? (
        <p className="at-ui mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{order.descripcion}</p>
      ) : null}
      {brief ? (
        <p className="at-ui mt-2 text-[13px] text-[var(--at-stone)]">
          {[brief.estilo, brief.formato, brief.uso].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </section>
  );

  const reviewBlock =
    role === "cliente" && estado === "completed" ? (
      <section className="mt-4">
        {reviewOpen ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void run(() =>
                reviewAtelierOrder(orderId, {
                  calidad: 5,
                  comunicacion: 5,
                  cumplimiento: 5,
                  tiempo: 5,
                  comentario: String(fd.get("comentario") || ""),
                }),
              );
            }}
          >
            <textarea
              name="comentario"
              className="at-ui at-focus min-h-24 w-full border border-[var(--at-hairline)] bg-[var(--at-offwhite)] p-3 text-[14px] outline-none"
              placeholder="Cómo fue el trazo, el trato, el tiempo…"
            />
            <AtelierButton type="submit" disabled={busy}>
              Publicar reseña
            </AtelierButton>
          </form>
        ) : (
          <AtelierButton variant="secondary" onClick={() => setReviewOpen(true)}>
            Dejar reseña
          </AtelierButton>
        )}
      </section>
    ) : null;

  return (
    <div className="at-desk-wrap">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <CommissionLabel id={order.id_order} />
          <StatusBadge estado={estado} />
        </div>
        <h1 className="at-display text-4xl text-[var(--at-ink)] md:text-5xl">{order.titulo}</h1>
        <p className="at-ui text-[15px] text-[var(--at-stone)]">
          {role === "cliente" ? order.nombre_artistico : order.cliente}
          {" · "}
          {formatMoneyPair(order.gross_amount)}
          {order.platform_fee != null ? ` · comisión ${formatSol(order.platform_fee)}` : ""}
          {order.creator_net != null ? ` · artista ${formatMoneyPair(order.creator_net)}` : ""}
        </p>
      </header>

      {error ? (
        <p role="alert" className="at-ui mt-6 text-[14px] text-[var(--at-accent)]">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <CommissionTimeline estado={estado} />
      </div>

      <div className="at-work-panes" role="tablist" aria-label="Encargo">
        {(
          [
            ["obra", "Obra"],
            ["chat", "Conversación"],
            ["archivos", "Archivos"],
            ["brief", "Brief"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pane === id}
            className={`at-work-pane at-focus ${pane === id ? "is-on" : ""}`}
            onClick={() => setPane(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 lg:hidden">
        {pane === "obra" ? obraBlock : null}
        {pane === "chat" ? chatBlock : null}
        {pane === "archivos" ? filesBlock : null}
        {pane === "brief" ? briefBlock : null}
        {reviewBlock}
      </div>

      <div className="at-work-desk">
        <div className="space-y-10">
          {obraBlock}
          {refs.length ? filesBlock : null}
          {order.descripcion || brief ? briefBlock : null}
          {reviewBlock}
        </div>
        <div className="at-work-chat">{chatBlock}</div>
      </div>

      {sticky ? <div className="at-sticky-act lg:hidden">{sticky}</div> : null}
    </div>
  );
}

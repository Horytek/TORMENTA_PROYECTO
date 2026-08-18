import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  createAtelierRequest,
  getAtelierClienteToken,
  getAtelierCreator,
} from "@/features/platform/api/atelier";
import { ATELIER_COPY } from "../copy";
import { atelierApiError, formatMoneyPair } from "../helpers";
import { ATELIER_ROUTES } from "../tokens";
import { creatorName, type AtelierCreator } from "../types";
import { uploadAtelierPrivateFile } from "../upload";
import { AtelierButton } from "./AtelierButton";
import { EmptyState } from "./EmptyState";
import { FileUploader, type AtelierUploadItem } from "./FileUploader";

const STEPS = ["IDEA", "ESTILO", "REFS", "DETALLES", "PRESUPUESTO", "FICHA"] as const;
type Step = (typeof STEPS)[number];

const ESTILOS = [
  "Acuarela",
  "Digital",
  "Anime / manga",
  "Realista",
  "Line art",
  "Óleo",
  "Chibi",
  "Concept art",
];

const FORMATOS = ["Retrato", "Media figura", "Cuerpo completo", "Escena", "Avatar"];
const USOS = ["Personal", "Redes / avatar", "Comercial", "Impresión"];
const PRIORIDADES = [
  { id: "normal" as const, label: "Sin prisa" },
  { id: "alta" as const, label: "Prioridad" },
  { id: "baja" as const, label: "Cuando pueda" },
];

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`at-chip at-focus at-ui border text-[13px] transition-colors ${
        selected
          ? "border-[var(--at-ink)] bg-[var(--at-ink)] text-[var(--at-offwhite)]"
          : "border-[var(--at-hairline)] bg-[var(--at-offwhite)] text-[var(--at-ink)] hover:border-[var(--at-ink)]"
      }`}
    >
      {children}
    </button>
  );
}

/** Wizard editorial: IDEA → ESTILO → REFS → DETALLES → PRESUPUESTO → ficha. */
export function CommissionComposer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const artistaSlug = params.get("artista")?.trim() || "";
  const loggedIn = Boolean(getAtelierClienteToken());

  const [step, setStep] = useState<Step>("IDEA");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estilo, setEstilo] = useState("");
  const [formato, setFormato] = useState("Retrato");
  const [uso, setUso] = useState("Personal");
  const [prioridad, setPrioridad] = useState<"baja" | "normal" | "alta">("normal");
  const [caracteristicas, setCaracteristicas] = useState("");
  const [min, setMin] = useState(80);
  const [max, setMax] = useState(220);
  const [refs, setRefs] = useState<AtelierUploadItem[]>([]);
  const [artist, setArtist] = useState<AtelierCreator | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!artistaSlug) {
      setArtist(null);
      return;
    }
    void getAtelierCreator(artistaSlug)
      .then((r) => setArtist(r.data || null))
      .catch(() => setArtist(null));
  }, [artistaSlug]);

  const idx = STEPS.indexOf(step);
  const idCreator = artist?.id_user || undefined;
  const canNext = useMemo(() => {
    if (step === "IDEA") return titulo.trim().length >= 2 && descripcion.trim().length >= 2;
    if (step === "ESTILO") return Boolean(estilo);
    if (step === "PRESUPUESTO") return max >= min && min >= 20;
    return true;
  }, [step, titulo, descripcion, estilo, min, max]);

  const addRefs = (files: File[]) => {
    setRefs((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "queued" as const,
      })),
    ]);
  };

  const publish = async () => {
    setError("");
    setBusy(true);
    try {
      const created = await createAtelierRequest({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        id_creator: idCreator,
        presupuesto: max,
        brief_json: {
          estilo,
          caracteristicas: caracteristicas.trim() || null,
          presupuesto_min: min,
          presupuesto_max: max,
          formato,
          uso,
          prioridad,
        },
      });
      const idRequest = created?.data?.id_request as number;
      if (!idRequest) throw new Error("No se pudo publicar el brief");

      for (const item of refs) {
        setRefs((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, status: "uploading", progress: 8 } : x)),
        );
        try {
          await uploadAtelierPrivateFile({
            file: item.file,
            category: "reference",
            role: "cliente",
            id_request: idRequest,
            onProgress: (pct) =>
              setRefs((prev) => prev.map((x) => (x.id === item.id ? { ...x, progress: pct } : x))),
          });
          setRefs((prev) =>
            prev.map((x) => (x.id === item.id ? { ...x, status: "done", progress: 100 } : x)),
          );
        } catch (e) {
          setRefs((prev) =>
            prev.map((x) =>
              (x.id === item.id
                ? { ...x, status: "error", error: atelierApiError(e, "No se subió la referencia") }
                : x),
            ),
          );
        }
      }

      navigate(ATELIER_ROUTES.clientRequest(idRequest));
    } catch (e) {
      setError(atelierApiError(e, ATELIER_COPY.processInterrupted));
    } finally {
      setBusy(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="at-desk-wrap">
        <EmptyState
          title="Entra como cliente para encargar"
          body="El brief y las referencias son privados. Entra con una cuenta de cliente y continúa el gesto."
          action={
            <AtelierButton asChild>
              <Link to={ATELIER_ROUTES.login}>{ATELIER_COPY.login}</Link>
            </AtelierButton>
          }
        />
      </div>
    );
  }

  const goStep = (i: number) => {
    if (i < 0 || i >= STEPS.length || i > idx) return;
    setStep(STEPS[i]);
  };

  return (
    <div className="at-desk-wrap">
      <p className="at-eyebrow">{ATELIER_COPY.privateCommission}</p>
      <h1 className="at-display mt-3 text-4xl text-[var(--at-ink)] md:text-5xl">
        {ATELIER_COPY.ctaCommission}
      </h1>
      <p className="at-ui mt-3 max-w-[60ch] text-[15px] text-[var(--at-stone)]">
        {artist
          ? `Para ${creatorName(artist)}. Solo este artista ve el brief.`
          : "Se publica al tablero: varios artistas pueden proponer."}
      </p>

      <div className="at-composer-desk mt-10">
        <ol className="at-steps-rail" aria-label="Pasos del brief">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                className={`at-step-btn at-focus ${i === idx ? "is-on" : ""} ${i < idx ? "is-done" : ""}`}
                disabled={i > idx}
                onClick={() => goStep(i)}
              >
                <span className="at-step-idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="at-step-name">{s}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="at-composer-stage">
          <div className="at-composer-stage-body space-y-6">
            {step === "IDEA" ? (
              <div className="at-composer-idea">
                <label className="block">
                  <span className="at-eyebrow">La idea</span>
                  <input
                    className="at-ui at-focus mt-2 w-full border-0 border-b border-[var(--at-hairline)] bg-transparent py-3 text-2xl text-[var(--at-ink)] outline-none md:text-3xl"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Un retrato de mi gata al atardecer"
                    maxLength={200}
                  />
                </label>
                <label className="block">
                  <span className="at-eyebrow">Cuéntalo</span>
                  <textarea
                    className="at-ui at-focus mt-2 min-h-36 w-full max-w-[60ch] border border-[var(--at-hairline)] bg-[var(--at-offwhite)] p-4 text-[15px] leading-relaxed text-[var(--at-ink)] outline-none lg:min-h-48"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Quién, qué atmósfera, qué no quieres que aparezca…"
                    maxLength={10000}
                  />
                </label>
              </div>
            ) : null}

            {step === "ESTILO" ? (
              <div className="flex flex-wrap gap-2">
                {ESTILOS.map((s) => (
                  <Chip key={s} selected={estilo === s} onClick={() => setEstilo(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            ) : null}

            {step === "REFS" ? (
              <FileUploader
                category="reference"
                label={ATELIER_COPY.dropReferences}
                items={refs}
                onFiles={addRefs}
                onCancel={(id) => setRefs((prev) => prev.filter((x) => x.id !== id))}
                hint="Privadas: solo las ve el artista del encargo. PNG, JPEG o WEBP · hasta 15 MB."
              />
            ) : null}

            {step === "DETALLES" ? (
              <>
                <div>
                  <p className="at-eyebrow">Formato</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {FORMATOS.map((s) => (
                      <Chip key={s} selected={formato === s} onClick={() => setFormato(s)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="at-eyebrow">Uso</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {USOS.map((s) => (
                      <Chip key={s} selected={uso === s} onClick={() => setUso(s)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="at-eyebrow">Ritmo</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PRIORIDADES.map((s) => (
                      <Chip key={s.id} selected={prioridad === s.id} onClick={() => setPrioridad(s.id)}>
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="at-eyebrow">Características</span>
                  <textarea
                    className="at-ui at-focus mt-2 min-h-28 w-full border border-[var(--at-hairline)] bg-[var(--at-offwhite)] p-4 text-[15px] text-[var(--at-ink)] outline-none"
                    value={caracteristicas}
                    onChange={(e) => setCaracteristicas(e.target.value)}
                    placeholder="Paleta, vestuario, mascotas, texto que no debe ir…"
                  />
                </label>
              </>
            ) : null}

            {step === "PRESUPUESTO" ? (
              <div className="at-composer-budget">
                <div className="space-y-6">
                  <label className="block">
                    <span className="at-eyebrow">Mínimo</span>
                    <input
                      type="range"
                      min={30}
                      max={800}
                      value={min}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMin(v);
                        if (v > max) setMax(v);
                      }}
                      className="mt-3 w-full accent-[var(--at-accent)]"
                    />
                  </label>
                  <label className="block">
                    <span className="at-eyebrow">Máximo</span>
                    <input
                      type="range"
                      min={30}
                      max={800}
                      value={max}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMax(v);
                        if (v < min) setMin(v);
                      }}
                      className="mt-3 w-full accent-[var(--at-accent)]"
                    />
                  </label>
                </div>
                <p className="at-display at-composer-money text-[var(--at-ink)]">
                  {formatMoneyPair(min)}
                  <span className="mx-2 text-[var(--at-stone)]">—</span>
                  {formatMoneyPair(max)}
                </p>
              </div>
            ) : null}

            {step === "FICHA" ? (
              <article className="at-ficha-colophon border border-[var(--at-hairline)] bg-[var(--at-offwhite)] px-5 py-6">
                <div>
                  <p className="at-eyebrow">{idCreator ? ATELIER_COPY.directedBrief : ATELIER_COPY.openBoard}</p>
                  <h2 className="at-display mt-3 text-2xl lg:text-3xl">{titulo || "Sin título"}</h2>
                  <p className="at-ui mt-3 max-w-[60ch] whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--at-ink)]">
                    {descripcion}
                  </p>
                </div>
                <dl className="at-ui grid gap-2 text-[13px] text-[var(--at-stone)]">
                  <div>Estilo · {estilo || "—"}</div>
                  <div>
                    {formato} · {uso} · {PRIORIDADES.find((p) => p.id === prioridad)?.label}
                  </div>
                  <div>
                    Presupuesto · {formatMoneyPair(min)} — {formatMoneyPair(max)}
                  </div>
                  <div>
                    Referencias · {refs.length ? `${refs.length} archivo${refs.length === 1 ? "" : "s"} privado${refs.length === 1 ? "" : "s"}` : "ninguna"}
                  </div>
                  {caracteristicas ? <div>{caracteristicas}</div> : null}
                </dl>
              </article>
            ) : null}

            {error ? (
              <p role="alert" className="at-ui text-[14px] text-[var(--at-accent)]">
                {error}
              </p>
            ) : null}
          </div>

          <div className="at-composer-actions">
            <AtelierButton
              variant="tertiary"
              disabled={idx === 0 || busy}
              onClick={() => setStep(STEPS[idx - 1])}
            >
              Atrás
            </AtelierButton>
            {step !== "FICHA" ? (
              <AtelierButton disabled={!canNext} onClick={() => setStep(STEPS[idx + 1])}>
                Continuar
              </AtelierButton>
            ) : (
              <AtelierButton disabled={busy || !canNext} onClick={() => void publish()}>
                {busy ? "Publicando…" : idCreator ? "Enviar al artista" : "Publicar en el tablero"}
              </AtelierButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

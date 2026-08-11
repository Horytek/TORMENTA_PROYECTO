import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Pause,
  Play,
  ShoppingBag,
  Store,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const DISTRICTS = [
  {
    id: "comas",
    name: "Comas",
    shop: "Abarrotes Doña Rosa",
    hook: "Viernes · delivery por zona",
    msg: "Hola Rosa, quiero:\n1. Arroz 5kg ×2\n2. Aceite 1L\nTotal: S/ 48\n¿Llega hoy a Collique?",
    detail:
      "El cliente ya te escribe. La vitrina solo organiza foto, precio y stock antes del mensaje.",
  },
  {
    id: "surquillo",
    name: "Surquillo",
    shop: "Ropa Barrio Norte",
    hook: "Sábado · prueba de talla en chat",
    msg: "Hola, pedí:\n1. Polo basic M ×1 — S/ 39\n2. Gorra mesh — S/ 25\nTotal: S/ 64\n¿Tienen negro?",
    detail:
      "Catálogo con stock real: si no hay talla, no aparece. El cierre sigue siendo conversación.",
  },
  {
    id: "centro",
    name: "Centro",
    shop: "Ferretería El Rayo",
    hook: "Entre semana · retiro en tienda",
    msg: "Buenas:\n1. Cinta aislante ×3\n2. Broca 6mm\nTotal: S/ 22\nPaso a las 6pm.",
    detail:
      "Sin app. Link en la bio o en el estado de WhatsApp. El ERP manda la verdad de inventario.",
  },
] as const;

const SURFACES = [
  {
    id: "vitrina",
    label: "Vitrina",
    title: "Catálogo público",
    body: "Foto, precio y stock. El cliente navega sin login.",
    preview: "browse",
  },
  {
    id: "wa",
    label: "WhatsApp",
    title: "Mensaje armado",
    body: "Ítems + total listos para confirmar en el chat.",
    preview: "chat",
  },
  {
    id: "erp",
    label: "Admin ERP",
    title: "Operación",
    body: "Productos y reglas desde Horytek — una sola fuente.",
    preview: "erp",
  },
] as const;

const FRIDAY = [
  {
    t: "09:10",
    title: "Abre la vitrina",
    body: "Rosa publica 180 SKUs desde el ERP. El link ya está en su WhatsApp.",
    msgs: 0,
    skus: 180,
  },
  {
    t: "12:40",
    title: "Primer carrito",
    body: "Llega un mensaje con ítems y total. Confirma stock de aceite.",
    msgs: 6,
    skus: 180,
  },
  {
    t: "17:20",
    title: "Pico del viernes",
    body: "~40 mensajes con carrito. Arma bolsas y agenda delivery por zona.",
    msgs: 40,
    skus: 180,
  },
  {
    t: "21:00",
    title: "Cierra el día",
    body: "Sin Excel paralelo. El chat fue la caja; el ERP fue la verdad.",
    msgs: 40,
    skus: 180,
  },
] as const;

/** Mapa de distritos + preview de mensaje entrante. */
export function CatalogoBarrioInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [active, setActive] = useState(0);
  const d = DISTRICTS[active];

  return (
    <section
      id="barrio"
      className="border-b border-black/5 py-20 md:py-24"
      style={{ background: "color-mix(in srgb, var(--lp-accent) 7%, #fff)" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          En el barrio
        </p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.7rem,3.2vw,2.45rem)] text-balance")}>
          Elige el distrito. Mira el pedido nacer.
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">
          No es otra tienda online. Toca un barrio y ve el mensaje que te llegaría.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-2">
            {DISTRICTS.map((item, i) => {
              const on = i === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300",
                    on
                      ? "border-transparent text-white shadow-lg"
                      : "border-black/8 bg-white/80 hover:border-black/15"
                  )}
                  style={on ? { backgroundColor: accent.accent } : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-semibold">{item.name}</span>
                    <span className={cn("text-[11px]", on ? "text-white/75" : "text-muted-foreground")}>
                      {item.hook}
                    </span>
                  </div>
                  <p className={cn("mt-1 text-[13px]", on ? "text-white/90" : "text-muted-foreground")}>
                    {item.shop}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-[#0b3d38] text-white shadow-[0_24px_60px_-32px_#0D9488]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-teal-200/80">WhatsApp entrante</p>
                <p className="text-[14px] font-semibold">{d.shop}</p>
              </div>
              <MessageCircle className="h-5 w-5 text-teal-200" />
            </div>
            <div className="space-y-3 bg-[#ece5dd] p-4 text-[#1c1917]">
              <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-white px-3 py-2.5 text-[13px] leading-relaxed shadow-sm">
                <pre className="whitespace-pre-wrap font-sans">{d.msg}</pre>
                <p className="mt-1 text-right text-[10px] text-black/35">{d.hook.split("·")[0]?.trim()}</p>
              </div>
              <p className="text-[12px] leading-relaxed text-[#0b3d38]/85">{d.detail}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {["Stock ERP", "Sin app", "Cierre en chat"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: accent.accent }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Toggle checkout vs chat — comparación interactiva. */
export function CatalogoPorQueInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const [mode, setMode] = useState<"checkout" | "chat">("chat");

  return (
    <section id="story" className="border-b border-black/5 bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Por qué existe
        </p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.7rem,3.2vw,2.5rem)] text-balance")}>
          {copy.sectionTitles.story ?? "Vender donde ya habla tu cliente"}
        </h2>

        <div className="mt-8 inline-flex rounded-full border border-black/10 bg-muted/40 p-1">
          {(
            [
              { id: "checkout" as const, label: "Checkout web" },
              { id: "chat" as const, label: "Cierre por chat" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={cn(
                "rounded-full px-4 py-2 text-[12px] font-semibold transition-all",
                mode === opt.id ? "text-white shadow" : "text-muted-foreground hover:text-foreground"
              )}
              style={mode === opt.id ? { backgroundColor: accent.accent } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div
            className="rounded-[1.4rem] border p-6 transition-colors duration-300"
            style={{
              borderColor: mode === "checkout" ? `${accent.accent}55` : "rgba(0,0,0,0.06)",
              background: mode === "checkout" ? `${accent.accent}10` : "#fafafa",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Si fuerzas tienda online
            </p>
            <ul className="mt-4 space-y-3 text-[14px] text-muted-foreground">
              <li>Cliente abandona el carrito por registro/pasarela.</li>
              <li>Pregunta igual por WhatsApp: “¿hay stock?”</li>
              <li>Duplicas precios entre web y chat.</li>
            </ul>
            {mode === "checkout" ? (
              <p className="mt-5 text-[13px] font-medium" style={{ color: accent.accent }}>
                Para cobro web completo → producto Ecommerce.
              </p>
            ) : null}
          </div>

          <div
            className="rounded-[1.4rem] border p-6 transition-all duration-300"
            style={{
              borderColor: mode === "chat" ? accent.accent : "rgba(0,0,0,0.06)",
              background: mode === "chat" ? "color-mix(in srgb, var(--lp-accent) 12%, white)" : "#fafafa",
              boxShadow: mode === "chat" ? `0 20px 50px -28px ${accent.accent}` : undefined,
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent.accent }}>
              Con Catálogo WA
            </p>
            <blockquote
              className="mt-4 border-l-[3px] pl-4 text-[clamp(1.05rem,1.6vw,1.2rem)] font-medium leading-snug"
              style={{ borderColor: accent.accent }}
            >
              {copy.story[0]}
            </blockquote>
            <div className="mt-4 space-y-3 text-[14px] text-muted-foreground">
              {copy.story.slice(1).map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Tres superficies con panel vivo conmutable. */
export function CatalogoSuperficiesInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const [idx, setIdx] = useState(0);
  const surface = SURFACES[idx];

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % SURFACES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="incluye" className="border-b border-black/5 py-20 md:py-24" style={{ background: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Lo que resuelve
        </p>
        <h2 className={cn(displayClass, "mt-2 text-[clamp(1.6rem,3vw,2.3rem)] text-balance")}>
          {copy.sectionTitles.surfaces ?? "Tres superficies, un pedido"}
        </h2>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Haz clic (o espera): el panel cambia. Un solo pedido atraviesa las tres capas.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {SURFACES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all",
                i === idx ? "border-transparent text-white" : "border-black/10 bg-white text-foreground/70 hover:text-foreground"
              )}
              style={i === idx ? { backgroundColor: accent.accent } : undefined}
            >
              <span className="font-mono text-[11px] opacity-70">{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-black/8 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: accent.accent }}>
              Paso {String(idx + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-[22px] font-semibold tracking-tight">{surface.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{surface.body}</p>
            <div className="mt-6 flex items-center gap-2 text-[12px] font-medium" style={{ color: accent.accent }}>
              Siguiente
              <ArrowRight className="h-3.5 w-3.5" />
              {SURFACES[(idx + 1) % SURFACES.length].label}
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {copy.trust.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-3 py-1 text-[11px] font-medium"
                  style={{ backgroundColor: `${accent.accent}18`, color: accent.ink }}
                >
                  # {t}
                </span>
              ))}
            </div>
          </div>

          <div className="min-h-[280px] overflow-hidden rounded-2xl border border-black/8 bg-[#0f172a] p-5 text-white shadow-xl">
            {surface.preview === "browse" ? (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Vitrina · /catalogo/1</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Polo basic", "Gorra", "Tote", "Calcetín"].map((name, i) => (
                    <div key={name} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div
                        className="mb-2 h-14 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${accent.accent}, ${i % 2 ? "#134e4a" : "#5eead4"})`,
                        }}
                      />
                      <p className="text-[12px] font-semibold">{name}</p>
                      <p className="text-[11px] text-white/50">Stock ERP · S/ {[39, 25, 45, 18][i]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {surface.preview === "chat" ? (
              <div className="flex h-full flex-col">
                <p className="text-[10px] uppercase tracking-[0.18em] text-teal-200/70">WhatsApp · mensaje listo</p>
                <div className="mt-4 max-w-[90%] self-end rounded-2xl rounded-br-md bg-[#dcf8c6] px-3 py-2 text-[12px] leading-relaxed text-[#1c1917]">
                  Hola, quiero pedir:
                  <br />
                  1. Polo basic ×1 — S/ 39
                  <br />
                  2. Gorra ×1 — S/ 25
                  <br />
                  <br />
                  Total: S/ 64
                </div>
                <p className="mt-auto pt-6 text-[12px] text-white/50">Sin pasarela. Tú confirmas en el chat.</p>
              </div>
            ) : null}
            {surface.preview === "erp" ? (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Horytek ERP · catálogo</p>
                {[
                  { n: "Polo basic", s: 12 },
                  { n: "Gorra mesh", s: 8 },
                  { n: "Tote canvas", s: 5 },
                ].map((row) => (
                  <div
                    key={row.n}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                  >
                    <span className="text-[13px] font-medium">{row.n}</span>
                    <span className="text-[12px] tabular-nums" style={{ color: accent.accent }}>
                      stock {row.s}
                    </span>
                  </div>
                ))}
                <p className="pt-2 text-[12px] text-white/50">Una fuente. La vitrina solo publica.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Simulador del viernes de Doña Rosa. */
export function CatalogoCasoInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const current = FRIDAY[step];

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % FRIDAY.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [playing]);

  const progress = useMemo(() => ((step + 1) / FRIDAY.length) * 100, [step]);

  return (
    <section id="flujo" className="border-b border-black/5 bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Caso de operación
            </p>
            <h2 className={cn(displayClass, "mt-2 text-[clamp(1.6rem,3vw,2.3rem)]")}>
              {copy.scenario.title}
            </h2>
            <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">{copy.scenario.body}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-medium text-white"
              style={{ backgroundColor: accent.accent }}
            >
              Escenario ilustrativo
            </span>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"
              aria-label={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-black/8 bg-[#0f172a] text-white">
          <div className="h-1.5 w-full bg-white/10">
            <div
              className="h-full transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%`, backgroundColor: accent.accent }}
            />
          </div>
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
              <p className="font-mono text-[13px]" style={{ color: accent.accent }}>
                {current.t}
              </p>
              <h3 className="mt-2 text-[22px] font-semibold">{current.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">{current.body}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {FRIDAY.map((f, i) => (
                  <button
                    key={f.t}
                    type="button"
                    onClick={() => {
                      setStep(i);
                      setPlaying(false);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                      i === step ? "text-white" : "bg-white/5 text-white/55 hover:bg-white/10"
                    )}
                    style={i === step ? { backgroundColor: accent.accent } : undefined}
                  >
                    {f.t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 p-6 sm:grid-cols-1 sm:gap-4">
              {[
                { value: String(current.msgs), label: "Mensajes con carrito", icon: MessageCircle },
                { value: String(current.skus), label: "SKUs en vitrina", icon: Store },
                { value: "0", label: "Apps del cliente", icon: ShoppingBag },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-transform duration-300"
                >
                  <m.icon className="mb-2 h-4 w-4" style={{ color: accent.accent }} />
                  <p className="text-[2rem] font-bold tabular-nums leading-none" style={{ color: accent.accent }}>
                    {m.value}
                  </p>
                  <p className="mt-2 text-[11px] text-white/55">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" style={{ color: accent.accent }} /> Sin Excel paralelo
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Warehouse className="h-3.5 w-3.5" style={{ color: accent.accent }} /> Stock desde ERP
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" style={{ color: accent.accent }} /> Cierre en chat
          </span>
        </div>
      </div>
    </section>
  );
}

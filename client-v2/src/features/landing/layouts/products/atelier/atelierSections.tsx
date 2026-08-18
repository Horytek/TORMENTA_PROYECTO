import { useState } from "react";
import { Check, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const ESTILOS = ["Acuarela", "Digital", "Cómic", "Lettering"] as const;

const CREADORES = [
  {
    id: "luna",
    nombre: "Luna Ink",
    estilo: "Acuarela",
    pieza: "Retrato de mascota",
    tarifa: "S/ 180",
    disponible: true,
  },
  {
    id: "nodo",
    nombre: "Nodo Studio",
    estilo: "Digital",
    pieza: "Personaje de juego",
    tarifa: "S/ 240",
    disponible: true,
  },
  {
    id: "tinta",
    nombre: "Tinta Norte",
    estilo: "Cómic",
    pieza: "Splash page",
    tarifa: "S/ 320",
    disponible: false,
  },
  {
    id: "letra",
    nombre: "Letra Viva",
    estilo: "Lettering",
    pieza: "Logo manuscrito",
    tarifa: "S/ 150",
    disponible: true,
  },
];

export function AtelierHeroMedia({ accent }: { accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/8 bg-white p-5 shadow-[0_28px_70px_-40px_var(--lp-accent)] md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Portafolio · Luna Ink
          </p>
          <p className="mt-1 text-lg font-semibold">Retrato de mascota</p>
          <p className="text-sm text-muted-foreground">Acuarela · A4 · 1 ajuste incluido</p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Disponible
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {["#FDF2F8", "#FBCFE8", "#DB2777"].map((tone, i) => (
          <div
            key={tone}
            className="aspect-[4/5] rounded-2xl border border-black/5"
            style={{
              background: `linear-gradient(160deg, ${tone} 0%, ${i === 2 ? "#9D174D" : "#FCE7F3"} 100%)`,
            }}
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-[#FDF2F8] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Encargo #AT-184</span>
          <span className="tabular-nums font-semibold" style={{ color: accent }}>
            S/ 180.00
          </span>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">Mercado Pago · escrow lógico</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/8">
          <div className="h-full w-[72%] rounded-full" style={{ backgroundColor: accent }} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Borrador en revisión · 1 ajuste restante</p>
      </div>
    </div>
  );
}

export function AtelierDiscovery({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [estilo, setEstilo] = useState<(typeof ESTILOS)[number]>("Acuarela");
  const [elegido, setElegido] = useState("luna");
  const visibles = CREADORES.filter((c) => c.estilo === estilo);

  return (
    <section id="job" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Discovery</p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.4vw,2.6rem)]")}>
          Filtra el estilo y elige al creador.
        </h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {ESTILOS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setEstilo(item);
                const primero = CREADORES.find((c) => c.estilo === item);
                if (primero) setElegido(primero.id);
              }}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                estilo === item ? "text-white" : "bg-white text-foreground shadow-sm",
              )}
              style={estilo === item ? { backgroundColor: accent.accent } : undefined}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {visibles.map((creador) => {
            const activo = elegido === creador.id;
            return (
              <button
                key={creador.id}
                type="button"
                onClick={() => setElegido(creador.id)}
                className={cn(
                  "rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5",
                  activo ? "border-transparent" : "border-black/8",
                )}
                style={activo ? { boxShadow: `inset 3px 0 0 ${accent.accent}` } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{creador.nombre}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">{creador.pieza}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold" style={{ color: accent.accent }}>
                    {creador.tarifa}
                  </span>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: accent.accent }}>
                  {activo ? <Check className="h-3.5 w-3.5" /> : <Palette className="h-3.5 w-3.5" />}
                  {activo ? "Creador elegido" : creador.disponible ? "Disponible esta semana" : "Agenda llena"}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const COTIZACION = [
  { id: "brief", label: "Brief", detalle: "Retrato acuarela A4 · mascota Coco" },
  { id: "cotizar", label: "Cotizar", detalle: "Luna Ink envía S/ 180 · 7 días" },
  { id: "aceptar", label: "Aceptar", detalle: "Cliente acepta y abre Mercado Pago" },
] as const;

type PasoCotizacion = (typeof COTIZACION)[number]["id"];

export function AtelierQuote({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [paso, setPaso] = useState<PasoCotizacion>("brief");
  const indice = COTIZACION.findIndex((p) => p.id === paso);

  return (
    <section id="flow" className="border-b border-black/5 bg-background py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Cotización</p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.4vw,2.6rem)]")}>
          Del brief al precio aceptado.
        </h2>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {COTIZACION.map((item, i) => {
            const activo = item.id === paso;
            const hecho = i < indice;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPaso(item.id)}
                className={cn(
                  "rounded-2xl border p-5 text-left transition",
                  activo ? "text-white" : "border-black/8 bg-white",
                )}
                style={activo ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                  0{i + 1} {hecho ? "· listo" : ""}
                </p>
                <p className="mt-2 text-lg font-semibold">{item.label}</p>
                <p className={cn("mt-2 text-sm", activo ? "text-white/80" : "text-muted-foreground")}>
                  {item.detalle}
                </p>
              </button>
            );
          })}
        </div>
        <div className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
          <p className="text-sm font-semibold">
            {paso === "brief" && "El cliente describe el encargo y adjunta referencias."}
            {paso === "cotizar" && "La creadora responde con precio, plazos y ajustes incluidos."}
            {paso === "aceptar" && "Al aceptar se abre el checkout de Mercado Pago. El fee 10% se calcula en backend."}
          </p>
        </div>
      </div>
    </section>
  );
}

const PEDIDO = ["enviada", "pagada", "en entrega", "reseña"] as const;
type PasoPedido = (typeof PEDIDO)[number];

export function AtelierOrderTracker({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [paso, setPaso] = useState<PasoPedido>("pagada");
  const indice = PEDIDO.indexOf(paso);

  return (
    <section id="proof" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Pedido demo</p>
            <h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>
              Cada estado se ve en el tracker.
            </h2>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ color: accent.accent, backgroundColor: `${accent.accent}14` }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Encargo #AT-184
          </span>
        </div>

        <ol className="mt-8 grid gap-2 sm:grid-cols-4">
          {PEDIDO.map((item, i) => {
            const activo = item === paso;
            const hecho = i <= indice;
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setPaso(item)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left text-sm font-semibold capitalize",
                    activo ? "text-white" : hecho ? "bg-white" : "border-dashed border-black/15 bg-white/50 text-muted-foreground",
                  )}
                  style={activo ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}
                >
                  <span className="block font-mono text-[11px] opacity-70">0{i + 1}</span>
                  {item}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-5 text-sm text-muted-foreground">
          {paso === "enviada" && "El cliente mandó el brief. Luna Ink aún no cotiza."}
          {paso === "pagada" && "Mercado Pago confirmó. El monto queda en escrow lógico hasta la entrega."}
          {paso === "en entrega" && "Hay un borrador en revisión. Queda 1 ajuste antes del archivo final."}
          {paso === "reseña" && "El cliente aprueba, deja reseña y el wallet del creador pasa a available."}
        </p>
      </div>
    </section>
  );
}

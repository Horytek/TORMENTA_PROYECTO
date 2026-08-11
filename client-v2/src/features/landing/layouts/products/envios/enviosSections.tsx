import { useState } from "react";
import type { FormEvent } from "react";
import { Box, Check, CircleDot, MapPin, PackageCheck, Search, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const HITOS = [
  { id: "registro", hora: "08:12", titulo: "Guía registrada", lugar: "Almacén Callao", icon: Box },
  { id: "clasificacion", hora: "09:05", titulo: "Clasificado en origen", lugar: "Hub Callao", icon: CircleDot },
  { id: "transito", hora: "10:40", titulo: "En tránsito", lugar: "Ruta Callao → Surco", icon: Truck },
  { id: "reparto", hora: "14:05", titulo: "En reparto local", lugar: "Miraflores", icon: MapPin },
  { id: "entrega", hora: "16:22", titulo: "Entregado", lugar: "Surco", icon: PackageCheck },
] as const;

export function ShipmentTrackingInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [codigo, setCodigo] = useState("DEMO01");
  const [consultado, setConsultado] = useState(true);
  const [encontrado, setEncontrado] = useState(true);
  const [paso, setPaso] = useState(2);

  const buscar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valido = codigo.trim().toUpperCase() === "DEMO01";
    setConsultado(true);
    setEncontrado(valido);
    if (valido) setPaso(2);
  };

  return (
    <section id="flujo" className="border-b border-black/5 bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Portal de seguimiento</p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.2vw,2.5rem)] text-balance")}>
          Una guía. Cada hito visible.
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">
          Escribe <strong>DEMO01</strong>, consulta la guía y recorre su avance como lo haría el destinatario.
        </p>

        <form onSubmit={buscar} className="mt-8 flex max-w-xl gap-2 rounded-2xl border border-black/8 bg-white p-2 shadow-sm">
          <label className="sr-only" htmlFor="tracking-demo">Código de seguimiento</label>
          <input
            id="tracking-demo"
            value={codigo}
            onChange={(event) => {
              setCodigo(event.target.value);
              setConsultado(false);
            }}
            placeholder="Código de seguimiento"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-[14px] uppercase outline-none"
          />
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white" style={{ backgroundColor: accent.accent }}>
            <Search className="h-3.5 w-3.5" /> Rastrear
          </button>
        </form>

        {consultado && !encontrado ? (
          <div className="mt-6 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800">
            No encontramos esa guía. Usa <strong className="font-mono">DEMO01</strong> para abrir el recorrido interactivo.
          </div>
        ) : null}

        {encontrado ? (
          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 px-6 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Guía activa</p>
                <p className="mt-1 font-mono text-[18px] font-bold" style={{ color: accent.accent }}>DEMO01</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold">{HITOS[paso].titulo}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Actualizado {HITOS[paso].hora}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <ol className="p-6">
                {HITOS.map((hito, index) => {
                  const completo = index <= paso;
                  return (
                    <li key={hito.id} className="relative flex gap-4 pb-7 last:pb-0">
                      {index < HITOS.length - 1 ? (
                        <span className="absolute left-[17px] top-9 h-[calc(100%-1.5rem)] w-px bg-black/10" aria-hidden />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setPaso(index)}
                        aria-label={`Ver hito: ${hito.titulo}`}
                        className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-transform hover:scale-105"
                        style={{ borderColor: completo ? accent.accent : "#d1d5db", color: completo ? accent.accent : "#94a3b8" }}
                      >
                        {index < paso ? <Check className="h-4 w-4" /> : <hito.icon className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => setPaso(index)} className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left">
                        <span>
                          <span className={cn("block text-[14px] font-semibold", !completo && "text-muted-foreground")}>{hito.titulo}</span>
                          <span className="mt-1 block text-[12px] text-muted-foreground">{hito.lugar}</span>
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">{hito.hora}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="flex flex-col justify-between bg-[#0f172a] p-6 text-white">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Vista del destinatario</p>
                  <p className="mt-4 font-mono text-[2.8rem] font-bold tabular-nums" style={{ color: accent.accent }}>
                    {Math.round(((paso + 1) / HITOS.length) * 100)}%
                  </p>
                  <p className="text-[12px] text-white/55">del recorrido completado</p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${((paso + 1) / HITOS.length) * 100}%`, backgroundColor: accent.accent }} />
                  </div>
                  <p className="mt-6 text-[14px] font-semibold">{HITOS[paso].titulo}</p>
                  <p className="mt-1 text-[12px] text-white/55">{HITOS[paso].lugar} · {HITOS[paso].hora}</p>
                </div>
                <div className="mt-8 flex gap-2">
                  <button type="button" onClick={() => setPaso((value) => Math.max(0, value - 1))} disabled={paso === 0} className="rounded-xl border border-white/15 px-3 py-2 text-[12px] font-semibold disabled:opacity-30">
                    Anterior
                  </button>
                  <button type="button" onClick={() => setPaso((value) => Math.min(HITOS.length - 1, value + 1))} disabled={paso === HITOS.length - 1} className="rounded-xl px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-30" style={{ backgroundColor: accent.accent }}>
                    Siguiente hito
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ShipmentQuoteInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [peso, setPeso] = useState(2);
  const [express, setExpress] = useState(false);
  const precio = 12 + peso * 2.5 + (express ? 10 : 0);
  return (
    <section id="cotizador-envios" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Cotizador inmediato</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Peso, velocidad y precio claros.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-black/8 bg-white p-6"><label className="text-sm font-semibold" htmlFor="peso-envio">Peso: {peso} kg</label><input id="peso-envio" type="range" min="1" max="12" value={peso} onChange={(event) => setPeso(Number(event.target.value))} className="mt-5 w-full" style={{ accentColor: accent.accent }} /><button type="button" onClick={() => setExpress((value) => !value)} className="mt-5 w-full rounded-xl border border-black/8 p-3 text-sm">Entrega {express ? "express · 24 h" : "estándar · 3 días"}</button></div><div className="rounded-2xl bg-[#0f172a] p-6 text-white"><p className="text-xs text-white/45">Total estimado</p><p className="mt-3 font-mono text-5xl font-bold" style={{ color: accent.accent }}>S/ {precio.toFixed(2)}</p><p className="mt-3 text-sm text-white/55">Lima → Arequipa · {peso} kg</p></div></div>
    </div></section>
  );
}

export function ShipmentIncidentDesk({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [estado, setEstado] = useState<"abierta" | "revisando" | "resuelta">("abierta");
  const siguiente = () => setEstado((actual) => actual === "abierta" ? "revisando" : actual === "revisando" ? "resuelta" : "abierta");
  return (
    <section id="incidencias-envios" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Mesa de incidencias</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Convierte una demora en respuesta.</h2>
      <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-black/8 bg-white p-6 sm:flex-row sm:items-center"><AlertCard estado={estado} accent={accent.accent} /><div className="flex-1"><p className="font-semibold">Guía DEMO24 · retraso en hub</p><p className="mt-1 text-sm text-muted-foreground">Cliente notificado y paquete localizado.</p></div><button type="button" onClick={siguiente} className="rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: accent.accent }}>Avanzar estado</button></div>
    </div></section>
  );
}

function AlertCard({ estado, accent }: { estado: string; accent: string }) {
  return <span className="rounded-full px-4 py-2 text-xs font-semibold capitalize text-white" style={{ backgroundColor: accent }}>{estado}</span>;
}

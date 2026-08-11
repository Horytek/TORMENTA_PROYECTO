import { useState } from "react";
import { ArrowRight, CircleDollarSign, Clock3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const ETAPAS = ["Nuevo", "Contacto", "Propuesta", "Ganado"] as const;
type Etapa = (typeof ETAPAS)[number];
type Negocio = { id: string; cliente: string; monto: string; etapa: Etapa; proxima: string };

const INICIALES: Negocio[] = [
  { id: "norte", cliente: "Distribuidora Norte", monto: "S/ 8,400", etapa: "Nuevo", proxima: "Llamar hoy" },
  { id: "inka", cliente: "Textiles Inka", monto: "S/ 12,900", etapa: "Contacto", proxima: "Demo · 16:00" },
  { id: "costa", cliente: "Café Costa", monto: "S/ 6,200", etapa: "Propuesta", proxima: "Revisar términos" },
];

export function CrmPipeline({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [negocios, setNegocios] = useState(INICIALES);
  const [ultimo, setUltimo] = useState("Haz clic en un negocio para avanzar");

  const avanzar = (id: string) => {
    setNegocios((actuales) => actuales.map((negocio) => {
      if (negocio.id !== id) return negocio;
      const indice = ETAPAS.indexOf(negocio.etapa);
      const etapa = ETAPAS[Math.min(indice + 1, ETAPAS.length - 1)];
      setUltimo(indice === ETAPAS.length - 1 ? `${negocio.cliente} ya está ganado` : `${negocio.cliente} pasó a ${etapa}`);
      return { ...negocio, etapa };
    }));
  };

  return (
    <section id="pipeline" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Pipeline comercial</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Cada clic acerca el cierre.</h2></div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs shadow-sm"><CircleDollarSign className="h-4 w-4" style={{ color: accent.accent }} /> Pipeline · S/ 27,500</div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {ETAPAS.map((etapa, indice) => {
            const cards = negocios.filter((negocio) => negocio.etapa === etapa);
            return (
              <div key={etapa} className="min-h-64 rounded-2xl border border-black/8 bg-white/65 p-3">
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="text-xs font-semibold">{etapa}</span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px]">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map((negocio) => (
                    <button key={negocio.id} type="button" onClick={() => avanzar(negocio.id)}
                      className="group w-full rounded-xl border border-black/8 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <span className="text-sm font-semibold">{negocio.cliente}</span>
                      <span className="mt-3 block font-mono text-lg font-bold" style={{ color: accent.accent }}>{negocio.monto}</span>
                      <span className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{negocio.proxima}</span>
                        {indice < ETAPAS.length - 1 ? <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /> : <Trophy className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  ))}
                  {!cards.length && <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-black/10 text-[10px] text-muted-foreground">Suelta la oportunidad aquí</div>}
                </div>
              </div>
            );
          })}
        </div>
        <p aria-live="polite" className="mt-4 text-center text-xs font-medium" style={{ color: accent.accent }}>{ultimo}</p>
      </div>
    </section>
  );
}

export function CrmLeadScoring({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [señales, setSeñales] = useState(["Visita precios"]);
  const opciones = ["Visita precios", "Abre correo", "Solicita demo"];
  const alternar = (item: string) => setSeñales((actual) => actual.includes(item) ? actual.filter((value) => value !== item) : [...actual, item]);
  const score = 35 + señales.length * 20;
  return (
    <section id="lead-scoring" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Scoring comercial</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Las señales ordenan tu siguiente llamada.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_.6fr]"><div className="space-y-2">{opciones.map((item) => <button key={item} type="button" onClick={() => alternar(item)} className={cn("w-full rounded-xl border p-4 text-left text-sm font-semibold", señales.includes(item) ? "text-white" : "border-black/8 bg-white")} style={señales.includes(item) ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}>{item}</button>)}</div><div className="rounded-2xl bg-[#111827] p-6 text-white"><p className="text-xs text-white/45">Afinidad</p><p className="mt-4 font-mono text-5xl font-bold" style={{ color: accent.accent }}>{score}%</p><p className="mt-3 text-sm text-white/55">{score >= 75 ? "Prioridad alta" : "En nutrición"}</p></div></div>
    </div></section>
  );
}

export function CrmFollowUpPlanner({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [dia, setDia] = useState("Hoy");
  const [creado, setCreado] = useState(false);
  return (
    <section id="seguimiento-crm" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Siguiente acción</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Ninguna oportunidad queda en silencio.</h2>
      <div className="mt-8 rounded-2xl border border-black/8 bg-white p-6"><div className="flex flex-wrap gap-2">{["Hoy", "Mañana", "Viernes"].map((item) => <button key={item} type="button" onClick={() => { setDia(item); setCreado(false); }} className={cn("rounded-full px-4 py-2 text-xs font-semibold", dia === item ? "text-white" : "bg-muted")} style={dia === item ? { backgroundColor: accent.accent } : undefined}>{item}</button>)}</div><div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex-1"><p className="font-semibold">Llamar a Distribuidora Norte</p><p className="text-sm text-muted-foreground">{dia} · 10:30</p></div><button type="button" onClick={() => setCreado((value) => !value)} className="rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: accent.accent }}>{creado ? "Seguimiento creado" : "Crear seguimiento"}</button></div></div>
    </div></section>
  );
}

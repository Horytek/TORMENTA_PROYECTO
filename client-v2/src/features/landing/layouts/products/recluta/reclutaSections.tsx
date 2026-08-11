import { useState } from "react";
import { Check, ChevronRight, FileText, MessageSquareText, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const ETAPAS = [
  { id: "postula", nombre: "Postulación", icono: FileText, nota: "CV recibido y datos normalizados." },
  { id: "filtro", nombre: "Filtro", icono: Sparkles, nota: "Perfil cumple 8 de 10 criterios." },
  { id: "entrevista", nombre: "Entrevista", icono: MessageSquareText, nota: "Agenda confirmada con la líder del área." },
  { id: "contrata", nombre: "Contratación", icono: UserCheck, nota: "Oferta lista para firma y onboarding." },
] as const;

const CANDIDATOS = [
  { id: "valeria", nombre: "Valeria Paredes", rol: "Analista comercial", score: 92 },
  { id: "diego", nombre: "Diego Ramos", rol: "Analista comercial", score: 86 },
  { id: "camila", nombre: "Camila Soto", rol: "Analista comercial", score: 81 },
] as const;

export function ReclutaFunnel({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [candidatoId, setCandidatoId] = useState<string>(CANDIDATOS[0].id);
  const [etapas, setEtapas] = useState<Record<string, number>>({});
  const candidato = CANDIDATOS.find((item) => item.id === candidatoId) ?? CANDIDATOS[0];
  const etapa = etapas[candidatoId] ?? 0;
  const avanzar = () => setEtapas((actual) => ({ ...actual, [candidatoId]: Math.min(etapa + 1, ETAPAS.length - 1) }));

  return (
    <section id="funnel" className="border-b border-black/5 bg-background py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Funnel de contratación</p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Acompaña a cada postulante, etapa por etapa.</h2>

        <div className="mt-8 grid gap-5 lg:grid-cols-[.65fr_1.35fr]">
          <div className="space-y-2">
            {CANDIDATOS.map((item) => {
              const active = item.id === candidatoId;
              const progreso = etapas[item.id] ?? 0;
              return (
                <button key={item.id} type="button" onClick={() => setCandidatoId(item.id)}
                  className={cn("w-full rounded-2xl border p-4 text-left transition-all", active ? "border-transparent text-white shadow-lg" : "border-black/8 bg-white hover:border-black/15")}
                  style={active ? { backgroundColor: accent.accent } : undefined}>
                  <span className="flex items-center justify-between"><strong className="text-sm">{item.nombre}</strong><span className="font-mono text-xs">{item.score}%</span></span>
                  <span className={cn("mt-1 block text-xs", active ? "text-white/70" : "text-muted-foreground")}>{item.rol} · {ETAPAS[progreso].nombre}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-black/8 bg-[#111827] p-5 text-white md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] uppercase tracking-wider text-white/40">Postulante activo</p><h3 className="mt-1 text-xl font-semibold">{candidato.nombre}</h3></div>
              <span className="rounded-full px-3 py-1 font-mono text-xs" style={{ backgroundColor: `${accent.accent}33`, color: accent.accent }}>afinidad {candidato.score}%</span>
            </div>
            <div className="mt-8 grid grid-cols-4 gap-2">
              {ETAPAS.map((item, index) => {
                const Icon = item.icono;
                const done = index < etapa;
                const active = index === etapa;
                return (
                  <button key={item.id} type="button" onClick={() => setEtapas((actual) => ({ ...actual, [candidatoId]: index }))}
                    aria-current={active ? "step" : undefined} className="group text-center">
                    <span className={cn("mx-auto flex h-10 w-10 items-center justify-center rounded-xl border transition-all", active ? "border-transparent text-white" : done ? "border-white/20 bg-white/10" : "border-white/10 text-white/35")}
                      style={active ? { backgroundColor: accent.accent } : undefined}>
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className={cn("mt-2 block text-[10px]", active ? "text-white" : "text-white/40")}>{item.nombre}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold" style={{ color: accent.accent }}>{ETAPAS[etapa].nombre}</p>
              <p className="mt-2 text-sm text-white/65">{ETAPAS[etapa].nota}</p>
            </div>
            <button type="button" onClick={avanzar} disabled={etapa === ETAPAS.length - 1}
              className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: accent.accent }}>
              {etapa === ETAPAS.length - 1 ? "Proceso completado" : `Mover a ${ETAPAS[etapa + 1].nombre}`}<ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ReclutaCriteriaBuilder({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const criterios = ["Experiencia B2B", "Excel avanzado", "Disponibilidad inmediata"];
  const [activos, setActivos] = useState([criterios[0]]);
  const alternar = (item: string) => setActivos((actual) => actual.includes(item) ? actual.filter((value) => value !== item) : [...actual, item]);
  return (
    <section id="criterios-recluta" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Filtro configurable</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Define qué significa un buen perfil.</h2>
      <div className="mt-8 grid gap-3 md:grid-cols-3">{criterios.map((item) => <button key={item} type="button" onClick={() => alternar(item)} className={cn("rounded-2xl border p-5 text-left font-semibold", activos.includes(item) ? "text-white" : "border-black/8 bg-white")} style={activos.includes(item) ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}><span className="block text-xs opacity-70">{activos.includes(item) ? "REQUERIDO" : "OPCIONAL"}</span><span className="mt-2 block">{item}</span></button>)}</div><p className="mt-4 text-sm text-muted-foreground">{activos.length} criterios aplicados · 18 perfiles recalculados</p>
    </div></section>
  );
}

export function ReclutaInterviewScorecard({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [puntajes, setPuntajes] = useState([3, 4, 3]);
  const etiquetas = ["Comunicación", "Criterio", "Experiencia"];
  const promedio = Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length * 20);
  return (
    <section id="scorecard-entrevista" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Scorecard de entrevista</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Evalúa con evidencia compartida.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_.5fr]"><div className="space-y-4 rounded-2xl border border-black/8 bg-white p-6">{etiquetas.map((item, index) => <label key={item} className="block text-sm font-semibold">{item}<input type="range" min="1" max="5" value={puntajes[index]} onChange={(event) => setPuntajes((actual) => actual.map((value, i) => i === index ? Number(event.target.value) : value))} className="mt-2 w-full" style={{ accentColor: accent.accent }} /></label>)}</div><div className="rounded-2xl bg-[#111827] p-6 text-white"><p className="text-xs text-white/45">Resultado</p><p className="mt-4 font-mono text-5xl font-bold" style={{ color: accent.accent }}>{promedio}%</p><p className="mt-3 text-sm text-white/55">Valeria Paredes</p></div></div>
    </div></section>
  );
}

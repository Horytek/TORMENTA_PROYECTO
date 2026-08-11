import { useState } from "react";
import { BookOpen, Check, LockKeyhole, Play, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const MODULOS = [
  { id: "base", numero: "01", titulo: "Fundamentos", duracion: "18 min", lecciones: 4, resumen: "Construye el vocabulario esencial antes de practicar." },
  { id: "practica", numero: "02", titulo: "Práctica guiada", duracion: "32 min", lecciones: 6, resumen: "Resuelve un caso paso a paso con retroalimentación." },
  { id: "proyecto", numero: "03", titulo: "Proyecto real", duracion: "45 min", lecciones: 5, resumen: "Aplica el método a un entregable de tu operación." },
  { id: "certifica", numero: "04", titulo: "Evaluación", duracion: "20 min", lecciones: 1, resumen: "Demuestra lo aprendido y recibe tu certificado." },
] as const;

export function AcademiaCoursePath({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [completados, setCompletados] = useState(0);
  const [seleccionado, setSeleccionado] = useState(0);
  const modulo = MODULOS[seleccionado];
  const desbloqueado = seleccionado <= completados;
  const completar = () => {
    if (!desbloqueado) return;
    setCompletados((actual) => Math.min(Math.max(actual, seleccionado + 1), MODULOS.length));
    setSeleccionado((actual) => Math.min(actual + 1, MODULOS.length - 1));
  };

  return (
    <section id="ruta" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Ruta de aprendizaje</p><h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Aprender abre el siguiente paso.</h2></div>
          <div className="min-w-44"><p className="text-right text-xs font-semibold">{Math.round((completados / MODULOS.length) * 100)}% completado</p><div className="mt-2 h-2 rounded-full bg-black/8"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(completados / MODULOS.length) * 100}%`, backgroundColor: accent.accent }} /></div></div>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <div className="space-y-3">
            {MODULOS.map((item, index) => {
              const locked = index > completados;
              const done = index < completados;
              const active = index === seleccionado;
              return (
                <button key={item.id} type="button" disabled={locked} onClick={() => setSeleccionado(index)}
                  className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all", active ? "border-transparent text-white shadow-lg" : "border-black/8 bg-white", locked && "cursor-not-allowed opacity-45")}
                  style={active ? { backgroundColor: accent.accent } : undefined}>
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs", active ? "bg-white/15" : "bg-muted")}>
                    {done ? <Check className="h-4 w-4" /> : locked ? <LockKeyhole className="h-4 w-4" /> : item.numero}
                  </span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm">{item.titulo}</strong><small className={active ? "text-white/65" : "text-muted-foreground"}>{item.lecciones} lecciones · {item.duracion}</small></span>
                  {done && <Trophy className="h-4 w-4" />}
                </button>
              );
            })}
          </div>

          <article className="flex min-h-80 flex-col rounded-[1.5rem] border border-black/8 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start justify-between">
              <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: `${accent.accent}18`, color: accent.accent }}>Módulo {modulo.numero}</span>
              {desbloqueado ? <BookOpen className="h-6 w-6" style={{ color: accent.accent }} /> : <LockKeyhole className="h-6 w-6 text-muted-foreground" />}
            </div>
            <h3 className="mt-8 text-2xl font-semibold">{modulo.titulo}</h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{modulo.resumen}</p>
            <div className="mt-7 grid grid-cols-3 gap-2">
              {Array.from({ length: Math.min(modulo.lecciones, 3) }, (_, index) => <div key={`${modulo.id}-${index}`} className="rounded-xl bg-muted/50 p-3"><span className="font-mono text-[10px] text-muted-foreground">LECCIÓN {index + 1}</span><p className="mt-2 text-xs font-semibold">{index === 0 ? "Concepto" : index === 1 ? "Ejemplo" : "Reto"}</p></div>)}
            </div>
            <button type="button" disabled={!desbloqueado || completados === MODULOS.length} onClick={completar}
              className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: accent.accent }}>
              {seleccionado < completados ? <><Check className="h-4 w-4" />Completado</> : <><Play className="h-4 w-4" />Completar y desbloquear</>}
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}

export function AcademiaQuizInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  return (
    <section id="quiz-academia" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Evaluación rápida</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Aprende respondiendo.</h2>
      <div className="mt-8 rounded-2xl border border-black/8 bg-white p-6"><p className="font-semibold">¿Qué acción mejora primero la trazabilidad?</p><div className="mt-4 grid gap-2">{["Registrar cada movimiento", "Esperar al cierre mensual", "Usar notas separadas"].map((item) => <button key={item} type="button" onClick={() => setRespuesta(item)} className={cn("rounded-xl border p-4 text-left text-sm", respuesta === item ? "text-white" : "border-black/8")} style={respuesta === item ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}>{item}</button>)}</div>{respuesta ? <p aria-live="polite" className="mt-4 text-sm font-semibold" style={{ color: accent.accent }}>{respuesta === "Registrar cada movimiento" ? "¡Correcto! La evidencia nace en la operación." : "Intenta otra opción."}</p> : null}</div>
    </div></section>
  );
}

export function AcademiaCertificatePreview({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [nombre, setNombre] = useState("María Torres");
  const [emitido, setEmitido] = useState(false);
  return (
    <section id="certificado-academia" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Certificado verificable</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>El logro queda listo para compartir.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-[.6fr_1fr]"><div className="rounded-2xl border border-black/8 bg-white p-5"><label className="text-xs font-semibold" htmlFor="nombre-certificado">Nombre del estudiante</label><input id="nombre-certificado" value={nombre} onChange={(event) => { setNombre(event.target.value); setEmitido(false); }} className="mt-2 w-full rounded-xl border border-black/10 p-3" /><button type="button" onClick={() => setEmitido(true)} className="mt-4 w-full rounded-xl p-3 text-sm font-semibold text-white" style={{ backgroundColor: accent.accent }}>Emitir certificado</button></div><div className="rounded-2xl border-4 border-double bg-white p-8 text-center" style={{ borderColor: accent.accent }}><Trophy className="mx-auto h-7 w-7" style={{ color: accent.accent }} /><p className="mt-4 text-xs uppercase tracking-widest">Certifica a</p><p className="mt-2 text-2xl font-semibold">{nombre || "Estudiante"}</p><p className="mt-3 text-sm text-muted-foreground">{emitido ? "Código HRY-2026-184 · emitido" : "Vista previa"}</p></div></div>
    </div></section>
  );
}

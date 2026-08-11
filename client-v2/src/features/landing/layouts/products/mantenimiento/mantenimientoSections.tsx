import { useState } from "react";
import { CalendarDays, CheckCircle2, Factory, Truck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const ACTIVOS = [
  { id: "prensa", nombre: "Prensa hidráulica", codigo: "PRE-04", icono: Factory, dias: [4, 12, 21], plan: "Lubricación y presión", tecnico: "Marco R." },
  { id: "furgon", nombre: "Furgón reparto", codigo: "VEH-12", icono: Truck, dias: [7, 16, 27], plan: "Frenos y kilometraje", tecnico: "Ana V." },
  { id: "tablero", nombre: "Tablero principal", codigo: "ELE-01", icono: Zap, dias: [3, 18, 25], plan: "Termografía y ajuste", tecnico: "Joel C." },
] as const;

const DIAS = Array.from({ length: 30 }, (_, index) => index + 1);

export function MantenimientoPreventivo({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [activoId, setActivoId] = useState<string>(ACTIVOS[0].id);
  const [dia, setDia] = useState<number>(ACTIVOS[0].dias[0]);
  const [confirmados, setConfirmados] = useState<number[]>([]);
  const activo = ACTIVOS.find((item) => item.id === activoId) ?? ACTIVOS[0];
  const programado = activo.dias.includes(dia as never);
  const confirmado = confirmados.includes(dia);

  const elegirActivo = (id: string) => {
    const siguiente = ACTIVOS.find((item) => item.id === id) ?? ACTIVOS[0];
    setActivoId(id);
    setDia(siguiente.dias[0]);
    setConfirmados([]);
  };

  return (
    <section id="preventivo" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Centro preventivo</p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Elige un activo. Ordena su mes.</h2>
        <p className="mt-3 text-sm text-muted-foreground">Los días marcados tienen mantenimiento. Selecciona uno para revisar y confirmar.</p>

        <div className="mt-8 grid overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm lg:grid-cols-[.72fr_1.28fr]">
          <aside className="border-b border-black/10 p-4 lg:border-b-0 lg:border-r">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Activos críticos</p>
            <div className="space-y-2">
              {ACTIVOS.map((item) => {
                const Icon = item.icono;
                const active = item.id === activo.id;
                return (
                  <button key={item.id} type="button" onClick={() => elegirActivo(item.id)}
                    className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all", active ? "border-transparent text-white shadow" : "border-black/5 bg-muted/25 hover:bg-muted/50")}
                    style={active ? { backgroundColor: accent.accent } : undefined}>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span><strong className="block text-sm">{item.nombre}</strong><small className={active ? "text-white/65" : "text-muted-foreground"}>{item.codigo} · 3 tareas</small></span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-xl bg-[#111827] p-4 text-white">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Plan seleccionado</p>
              <p className="mt-2 text-sm font-semibold">{activo.plan}</p>
              <p className="mt-1 text-xs text-white/55">Responsable · {activo.tecnico}</p>
            </div>
          </aside>

          <div className="p-5 md:p-7">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Junio 2026</p><h3 className="text-lg font-semibold">{activo.nombre}</h3></div>
              <CalendarDays className="h-6 w-6" style={{ color: accent.accent }} />
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px]">
              {["L", "M", "M", "J", "V", "S", "D"].map((label, index) => <span key={`${label}-${index}`} className="py-1 font-semibold text-muted-foreground">{label}</span>)}
              {DIAS.map((numero) => {
                const hasPlan = activo.dias.includes(numero as never);
                const selected = dia === numero;
                return (
                  <button key={numero} type="button" onClick={() => setDia(numero)}
                    aria-label={`Día ${numero}${hasPlan ? ", mantenimiento programado" : ""}`}
                    className={cn("relative aspect-square rounded-lg text-xs transition-all hover:bg-muted", selected && "text-white shadow") }
                    style={selected ? { backgroundColor: accent.accent } : undefined}>
                    {numero}
                    {hasPlan && !selected && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" style={{ backgroundColor: accent.accent }} />}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-black/8 bg-muted/20 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Martes {dia} · 09:00</p>
                <p className="mt-1 text-sm font-semibold">{programado ? activo.plan : "Sin tarea programada"}</p>
              </div>
              <button type="button" disabled={!programado || confirmado} onClick={() => setConfirmados((actual) => [...actual, dia])}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
                style={{ backgroundColor: accent.accent }}>
                <CheckCircle2 className="h-4 w-4" /> {confirmado ? "Confirmado" : "Confirmar visita"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MantenimientoRiskMatrix({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [impacto, setImpacto] = useState(2);
  const [probabilidad, setProbabilidad] = useState(2);
  const riesgo = impacto * probabilidad;
  return (
    <section id="riesgo-mantenimiento" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Matriz de riesgo</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Prioriza antes de que falle.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_.5fr]"><div className="rounded-2xl border border-black/8 bg-white p-6"><label className="block text-sm font-semibold">Impacto: {impacto}<input type="range" min="1" max="5" value={impacto} onChange={(event) => setImpacto(Number(event.target.value))} className="mt-3 w-full" style={{ accentColor: accent.accent }} /></label><label className="mt-6 block text-sm font-semibold">Probabilidad: {probabilidad}<input type="range" min="1" max="5" value={probabilidad} onChange={(event) => setProbabilidad(Number(event.target.value))} className="mt-3 w-full" style={{ accentColor: accent.accent }} /></label></div><div className="rounded-2xl bg-[#111827] p-6 text-white"><p className="text-xs text-white/45">Nivel calculado</p><p className="mt-4 font-mono text-5xl font-bold" style={{ color: accent.accent }}>{riesgo}</p><p className="mt-3 text-sm text-white/55">{riesgo >= 15 ? "Atención inmediata" : riesgo >= 8 ? "Programar pronto" : "Riesgo controlado"}</p></div></div>
    </div></section>
  );
}

export function MantenimientoWorkOrderInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const pasos = ["Reportada", "Asignada", "En reparación", "Cerrada"];
  const [paso, setPaso] = useState(0);
  return (
    <section id="orden-correctiva" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Orden correctiva</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>De la alerta al activo recuperado.</h2>
      <div className="mt-8 rounded-2xl border border-black/8 bg-white p-6"><div className="grid grid-cols-4 gap-2">{pasos.map((item, index) => <button key={item} type="button" onClick={() => setPaso(index)} className={cn("rounded-xl border p-3 text-xs font-semibold", index <= paso ? "text-white" : "border-black/8")} style={index <= paso ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}>{item}</button>)}</div><div className="mt-6 flex items-center justify-between gap-4"><div><p className="font-semibold">OT-COR-028 · Prensa hidráulica</p><p className="text-sm text-muted-foreground">Estado: {pasos[paso]}</p></div><button type="button" disabled={paso === pasos.length - 1} onClick={() => setPaso((value) => Math.min(pasos.length - 1, value + 1))} className="rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: accent.accent }}>Avanzar</button></div></div>
    </div></section>
  );
}

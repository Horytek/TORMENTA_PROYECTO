import { useState } from "react";
import { Check, ChevronRight, Gauge, PackageCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const ETAPAS = [
  { id: "corte", label: "Corte", hora: "08:20", avance: 25, detalle: "Piezas medidas y lote de material consumido." },
  { id: "ensamble", label: "Ensamble", hora: "10:45", avance: 50, detalle: "Componentes unidos y control dimensional aprobado." },
  { id: "acabado", label: "Acabado", hora: "14:10", avance: 75, detalle: "Pulido, pintura y revisión visual en curso." },
  { id: "cierre", label: "Cierre", hora: "17:30", avance: 100, detalle: "OT valorizada, entregable listo y stock actualizado." },
] as const;

export function TallerOtMachine({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [step, setStep] = useState(0);
  const etapa = ETAPAS[step];
  const avanzar = () => setStep((actual) => (actual + 1) % ETAPAS.length);

  return (
    <section id="flujo" className="border-b border-black/5 bg-[#111827] py-16 text-white md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Máquina de orden de trabajo</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className={cn(displayClass, "max-w-2xl text-[clamp(1.8rem,3.4vw,2.6rem)]")}>
            La OT avanza. El taller queda trazado.
          </h2>
          <span className="font-mono text-sm" style={{ color: accent.accent }}>OT-0248 · {etapa.avance}%</span>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-4 border-b border-white/10">
              {ETAPAS.map((item, index) => {
                const active = index === step;
                const done = index < step;
                return (
                  <button key={item.id} type="button" onClick={() => setStep(index)}
                    aria-current={active ? "step" : undefined}
                    className={cn("relative px-2 py-4 text-center text-xs transition-colors", active ? "bg-white/10 text-white" : "text-white/45 hover:text-white")}>
                    <span className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full border"
                      style={active || done ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}>
                      {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    {item.label}
                    {active && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: accent.accent }} />}
                  </button>
                );
              })}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-white/45">{etapa.hora} · estación {step + 1}</p>
                  <h3 className="mt-1 text-2xl font-semibold">{etapa.label}</h3>
                </div>
                <Gauge className="h-8 w-8" style={{ color: accent.accent }} />
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">{etapa.detalle}</p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${etapa.avance}%`, backgroundColor: accent.accent }} />
              </div>
              <button type="button" onClick={avanzar} className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: accent.accent }}>
                {step === ETAPAS.length - 1 ? "Reiniciar OT" : `Pasar a ${ETAPAS[step + 1].label}`}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <aside className="space-y-3">
            {[["Operario", "Luis P."], ["Tiempo activo", `${step * 2 + 2} h 15 min`], ["Costo acumulado", `S/ ${180 + step * 145}`]].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
                <p className="mt-1 font-mono text-lg">{value}</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}

export function TallerResumen({ module }: { module: LandingProductModule }) {
  const { accent } = useLayoutChrome(module);
  return (
    <section className="border-b border-black/5 py-14" style={{ background: module.accent.surface }}>
      <div className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-3">
        {[[Wrench, "Una OT, una verdad", "Mano de obra, materiales y tiempos juntos."], [PackageCheck, "Consumo trazable", "Cada pieza descuenta el inventario correcto."], [Gauge, "Margen visible", "Compara costo previsto y real antes del cierre."]].map(([Icon, title, body]) => {
          const FeatureIcon = Icon as typeof Wrench;
          return <div key={String(title)} className="border-l-2 pl-4" style={{ borderColor: accent.accent }}><FeatureIcon className="h-5 w-5" style={{ color: accent.accent }} /><h3 className="mt-3 font-semibold">{String(title)}</h3><p className="mt-1 text-sm text-muted-foreground">{String(body)}</p></div>;
        })}
      </div>
    </section>
  );
}

export function TallerMaterialCalculator({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [cantidad, setCantidad] = useState(4);
  return (
    <section id="materiales-taller" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Consumo de materiales</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Cotiza antes de cortar.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">{[["Planchas", cantidad], ["Pernos", cantidad * 6], ["Costo", `S/ ${cantidad * 86}`]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-black/8 bg-white p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-mono text-3xl font-bold" style={{ color: accent.accent }}>{value}</p></div>)}</div><div className="mt-4 flex gap-2"><button type="button" onClick={() => setCantidad((value) => Math.max(1, value - 1))} className="rounded-xl border border-black/10 px-4 py-2">− Pieza</button><button type="button" onClick={() => setCantidad((value) => value + 1)} className="rounded-xl px-4 py-2 text-white" style={{ backgroundColor: accent.accent }}>+ Pieza</button></div>
    </div></section>
  );
}

export function TallerQualityChecklist({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const controles = ["Medidas verificadas", "Acabado aprobado", "Fotos adjuntas"];
  const [listos, setListos] = useState<string[]>([]);
  const alternar = (item: string) => setListos((actual) => actual.includes(item) ? actual.filter((value) => value !== item) : [...actual, item]);
  return (
    <section id="calidad-taller" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Control de calidad</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>La OT no cierra con pendientes.</h2>
      <div className="mt-8 rounded-2xl border border-black/8 bg-white p-6">{controles.map((item) => <button key={item} type="button" onClick={() => alternar(item)} className="mb-2 flex w-full items-center justify-between rounded-xl border border-black/8 p-4 text-left"><span>{item}</span><span className={cn("flex h-7 w-7 items-center justify-center rounded-full", listos.includes(item) ? "text-white" : "bg-muted")} style={listos.includes(item) ? { backgroundColor: accent.accent } : undefined}>{listos.includes(item) ? <Check className="h-4 w-4" /> : null}</span></button>)}<p className="mt-3 text-sm font-semibold" style={{ color: accent.accent }}>{listos.length === controles.length ? "OT lista para entregar" : `${controles.length - listos.length} controles pendientes`}</p></div>
    </div></section>
  );
}

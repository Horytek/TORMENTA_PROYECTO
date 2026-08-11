import { useState } from "react";
import { AlertTriangle, CarFront, Check, Fuel, ShieldCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const UNIDADES = [
  {
    id: "abc",
    placa: "ABC-123",
    modelo: "Toyota Hilux",
    estado: "Operativa",
    combustible: 68,
    eventos: [
      { id: "a1", tipo: "fuel", fecha: "Hoy · 08:20", titulo: "Carga de combustible", detalle: "32 L · S/ 174.40", ok: true },
      { id: "a2", tipo: "soat", fecha: "12 nov 2026", titulo: "Vencimiento SOAT", detalle: "95 días restantes", ok: true },
      { id: "a3", tipo: "service", fecha: "2,400 km", titulo: "Próximo mantenimiento", detalle: "Cambio de aceite y filtros", ok: true },
    ],
  },
  {
    id: "def",
    placa: "DEF-456",
    modelo: "Hyundai H-1",
    estado: "Atención",
    combustible: 24,
    eventos: [
      { id: "d1", tipo: "fuel", fecha: "Ayer · 17:45", titulo: "Consumo fuera de rango", detalle: "Rendimiento: 6.2 km/L", ok: false },
      { id: "d2", tipo: "soat", fecha: "30 ago 2026", titulo: "Vencimiento SOAT", detalle: "21 días restantes", ok: false },
      { id: "d3", tipo: "service", fecha: "480 km", titulo: "Próximo mantenimiento", detalle: "Inspección de frenos", ok: true },
    ],
  },
  {
    id: "ghi",
    placa: "GHI-789",
    modelo: "Kia K2700",
    estado: "Operativa",
    combustible: 82,
    eventos: [
      { id: "g1", tipo: "fuel", fecha: "Hoy · 06:10", titulo: "Carga de combustible", detalle: "40 L · S/ 218.00", ok: true },
      { id: "g2", tipo: "soat", fecha: "05 ene 2027", titulo: "Vencimiento SOAT", detalle: "149 días restantes", ok: true },
      { id: "g3", tipo: "service", fecha: "5,100 km", titulo: "Próximo mantenimiento", detalle: "Revisión preventiva", ok: true },
    ],
  },
] as const;

const ICONS = { fuel: Fuel, soat: ShieldCheck, service: Wrench } as const;

export function FleetTimelineInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [unidadId, setUnidadId] = useState<(typeof UNIDADES)[number]["id"]>(UNIDADES[0].id);
  const [resueltos, setResueltos] = useState<string[]>([]);
  const unidad = UNIDADES.find((item) => item.id === unidadId) ?? UNIDADES[0];

  const resolver = (id: string) => {
    setResueltos((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <section id="flujo" className="border-b border-black/5 py-20 md:py-24" style={{ background: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Bitácora de unidad</p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.2vw,2.5rem)] text-balance")}>
          Elige una placa. Lee toda su historia.
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">
          SOAT, combustible y mantenimiento comparten una línea de tiempo accionable.
        </p>

        <div className="mt-9 flex flex-wrap gap-2">
          {UNIDADES.map((item) => {
            const activo = item.id === unidadId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setUnidadId(item.id)}
                className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-semibold transition-all", activo ? "border-transparent text-white shadow" : "border-black/10 bg-white")}
                style={activo ? { backgroundColor: accent.accent } : undefined}
              >
                <CarFront className="h-3.5 w-3.5" />
                {item.placa}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid overflow-hidden rounded-[1.5rem] border border-black/8 bg-white lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="border-b border-black/8 p-6 lg:border-b-0 lg:border-r">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Unidad seleccionada</p>
            <p className="mt-2 font-mono text-[2rem] font-bold tracking-tight" style={{ color: accent.accent }}>{unidad.placa}</p>
            <p className="text-[14px] font-medium">{unidad.modelo}</p>
            <span className={cn("mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold", unidad.estado === "Operativa" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
              {unidad.estado === "Operativa" ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {unidad.estado}
            </span>
            <div className="mt-8">
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">Tanque estimado</span>
                <span className="font-mono font-semibold">{unidad.combustible}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/8">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${unidad.combustible}%`, backgroundColor: accent.accent }} />
              </div>
            </div>
          </aside>

          <div className="bg-[#0f172a] p-6 text-white">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Timeline operativo</p>
            <ol className="mt-5 space-y-3">
              {unidad.eventos.map((evento) => {
                const Icon = ICONS[evento.tipo];
                const resuelto = resueltos.includes(evento.id);
                return (
                  <li key={evento.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: evento.ok || resuelto ? `${accent.accent}30` : "#f59e0b30", color: evento.ok || resuelto ? accent.accent : "#fbbf24" }}>
                      {resuelto ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold">{evento.titulo}</p>
                          <p className="mt-1 text-[11px] text-white/50">{evento.detalle}</p>
                        </div>
                        <span className="font-mono text-[10px] text-white/45">{evento.fecha}</span>
                      </div>
                      {!evento.ok ? (
                        <button type="button" onClick={() => resolver(evento.id)} className="mt-3 text-[11px] font-semibold" style={{ color: accent.accent }}>
                          {resuelto ? "Reabrir alerta" : "Marcar gestionado"}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FleetFuelComparator({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [periodo, setPeriodo] = useState<"semana" | "mes">("semana");
  const datos = periodo === "semana" ? [62, 78, 49] : [71, 64, 83];
  return (
    <section id="consumo-flota" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Consumo comparado</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Detecta qué unidad bebe de más.</h2>
      <div className="mt-7 flex gap-2">{(["semana", "mes"] as const).map((item) => <button key={item} type="button" onClick={() => setPeriodo(item)} className={cn("rounded-full px-4 py-2 text-xs font-semibold capitalize", periodo === item ? "text-white" : "bg-muted")} style={periodo === item ? { backgroundColor: accent.accent } : undefined}>{item}</button>)}</div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">{UNIDADES.map((item, index) => <div key={item.id} className="rounded-2xl border border-black/8 bg-white p-5"><p className="font-mono font-bold">{item.placa}</p><div className="mt-5 h-28 rounded-xl bg-muted/40 p-3"><div className="mt-auto h-full rounded-lg transition-[height]" style={{ height: `${datos[index]}%`, backgroundColor: accent.accent }} /></div><p className="mt-3 text-sm">{datos[index]} L / 100 km</p></div>)}</div>
    </div></section>
  );
}

export function FleetAvailabilityBoard({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [fuera, setFuera] = useState<string[]>(["def"]);
  const alternar = (id: string) => setFuera((actual) => actual.includes(id) ? actual.filter((item) => item !== id) : [...actual, id]);
  return (
    <section id="disponibilidad-flota" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Disponibilidad diaria</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Activa solo las unidades listas.</h2>
      <div className="mt-8 space-y-2">{UNIDADES.map((item) => { const activa = !fuera.includes(item.id); return <button key={item.id} type="button" onClick={() => alternar(item.id)} className="flex w-full items-center justify-between rounded-xl border border-black/8 bg-white p-4 text-left"><span><strong>{item.placa}</strong><small className="ml-3 text-muted-foreground">{item.modelo}</small></span><span className={cn("rounded-full px-3 py-1 text-xs font-semibold", activa ? "text-white" : "bg-amber-50 text-amber-700")} style={activa ? { backgroundColor: accent.accent } : undefined}>{activa ? "Disponible" : "En pausa"}</span></button>; })}</div>
    </div></section>
  );
}

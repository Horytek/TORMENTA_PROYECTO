import { useState } from "react";
import { Check, Clock3, MapPin, RotateCcw, Truck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const DRIVERS = [
  { id: "ana", name: "Ana Torres", vehicle: "VAN-12", color: "#2563eb" },
  { id: "luis", name: "Luis Paredes", vehicle: "MOTO-08", color: "#e11d48" },
  { id: "marco", name: "Marco León", vehicle: "FURGÓN-03", color: "#059669" },
] as const;

const STOPS = [
  { id: "s1", zone: "San Isidro", address: "Av. República 418", window: "09:00–10:00", packages: 4 },
  { id: "s2", zone: "Miraflores", address: "Calle Porta 126", window: "09:30–11:00", packages: 2 },
  { id: "s3", zone: "Surquillo", address: "Jr. Dante 740", window: "10:00–12:00", packages: 7 },
  { id: "s4", zone: "Barranco", address: "Av. Grau 231", window: "11:00–13:00", packages: 3 },
  { id: "s5", zone: "Chorrillos", address: "Alameda Sur 880", window: "12:00–14:00", packages: 5 },
  { id: "s6", zone: "Santiago de Surco", address: "Av. Primavera 991", window: "13:00–15:00", packages: 6 },
] as const;

type Assignments = Record<string, string>;

export function DespachoRouteBoard({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [selectedDriver, setSelectedDriver] = useState<string>(DRIVERS[0].id);
  const [assignments, setAssignments] = useState<Assignments>({});
  const assignedCount = Object.keys(assignments).length;

  function assignStop(stopId: string) {
    setAssignments((current) => {
      if (current[stopId] === selectedDriver) {
        const next = { ...current };
        delete next[stopId];
        return next;
      }

      return { ...current, [stopId]: selectedDriver };
    });
  }

  return (
    <section
      id="flow"
      className="border-b border-black/5 py-20 md:py-28"
      style={{ backgroundColor: accent.sectionTint }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent.accent }}>
              Mesa de despacho
            </p>
            <h2 className={cn(displayClass, "mt-3 text-[clamp(1.9rem,3.5vw,2.65rem)]")}>
              Arma la ruta antes de encender el motor.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              Elige un conductor y toca las paradas que debe atender. Vuelve a tocar una parada para retirarla de su ruta.
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-5 py-3 text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Cobertura del tablero</p>
            <p className="mt-1 font-mono text-[24px] font-semibold" style={{ color: accent.accent }}>
              {assignedCount}/{STOPS.length}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.38fr_0.62fr]">
          <aside className="rounded-3xl border border-black/5 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold">Conductores disponibles</p>
              <button
                type="button"
                onClick={() => setAssignments({})}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Limpiar
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {DRIVERS.map((driver) => {
                const active = selectedDriver === driver.id;
                const count = Object.values(assignments).filter((id) => id === driver.id).length;

                return (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => setSelectedDriver(driver.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition"
                    style={{
                      borderColor: active ? `${driver.color}66` : "rgba(0,0,0,.06)",
                      backgroundColor: active ? `${driver.color}0d` : "transparent",
                    }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: driver.color }}
                    >
                      <UserRound className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">{driver.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{driver.vehicle}</span>
                    </span>
                    <span className="rounded-full bg-black/[0.05] px-2 py-1 font-mono text-[10px]">{count} paradas</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl bg-black/[0.035] p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Modo asignación</p>
              <p className="mt-2 text-[12px] font-medium">
                Las próximas paradas irán a{" "}
                <span style={{ color: DRIVERS.find((driver) => driver.id === selectedDriver)?.color }}>
                  {DRIVERS.find((driver) => driver.id === selectedDriver)?.name}
                </span>
              </p>
            </div>
          </aside>

          <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_28px_70px_-45px_var(--lp-accent)]">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ruta Lima centro-sur</p>
                <p className="mt-1 text-[14px] font-semibold">Domingo · 27 paquetes</p>
              </div>
              <Truck className="h-5 w-5" style={{ color: accent.accent }} />
            </div>
            <div className="relative p-5 md:p-6">
              <div className="absolute bottom-10 left-[42px] top-10 w-px bg-black/10" aria-hidden />
              <div className="relative space-y-3">
                {STOPS.map((stop, index) => {
                  const driver = DRIVERS.find((entry) => entry.id === assignments[stop.id]);
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => assignStop(stop.id)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 text-left transition hover:translate-x-1 hover:shadow-sm"
                      aria-label={`Asignar ${stop.zone} al conductor seleccionado`}
                    >
                      <span
                        className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white font-mono text-[10px] font-semibold"
                        style={{ borderColor: driver?.color ?? "rgba(0,0,0,.12)", color: driver?.color }}
                      >
                        {driver ? <Check className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[13px] font-semibold">{stop.zone}</span>
                          <span className="text-[11px] text-muted-foreground">{stop.address}</span>
                        </span>
                        <span className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{stop.window}</span>
                          <span>{stop.packages} paquetes</span>
                        </span>
                      </span>
                      {driver ? (
                        <span
                          className="hidden rounded-full px-2.5 py-1 text-[10px] font-semibold text-white sm:block"
                          style={{ backgroundColor: driver.color }}
                        >
                          {driver.name.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="hidden text-[10px] text-muted-foreground sm:block">Sin asignar</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DespachoShiftSummary({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const [focus, setFocus] = useState(0);

  return (
    <section id="despacho-lectura" className="border-b border-black/5 py-20 md:py-24" style={{ backgroundColor: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent.accent }}>
          Una sola lectura
        </p>
        <h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3vw,2.4rem)]")}>
          Cada parada tiene dueño y horario.
        </h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {copy.highlights.slice(0, 3).map((h, i) => (
            <button
              key={h.title}
              type="button"
              onClick={() => setFocus(i)}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] font-semibold",
                focus === i ? "border-transparent text-white" : "border-black/10 bg-white"
              )}
              style={focus === i ? { backgroundColor: accent.accent } : undefined}
            >
              {h.title}
            </button>
          ))}
        </div>
        <p className="mt-5 max-w-2xl text-[14px] text-muted-foreground">{copy.highlights[focus]?.body}</p>
      </div>
    </section>
  );
}

/** Simula ventana ETA vs retraso. */
export function DespachoEtaBoard({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [delay, setDelay] = useState(0);
  const base = ["09:40", "10:15", "11:05"];

  return (
    <section id="despacho-eta" className="border-b border-black/5 bg-background py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">ETA en vivo</p>
        <h2 className={cn(displayClass, "mt-2 text-[clamp(1.5rem,2.8vw,2.1rem)]")}>
          Arrastra el retraso y recalcula
        </h2>
        <input
          type="range"
          min={0}
          max={45}
          step={5}
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          className="mt-6 w-full max-w-md"
        />
        <p className="mt-2 text-[13px] font-medium" style={{ color: accent.accent }}>
          Retraso simulado: +{delay} min
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {base.map((t, i) => {
            const [h, m] = t.split(":").map(Number);
            const total = h * 60 + m + delay;
            const nh = String(Math.floor(total / 60) % 24).padStart(2, "0");
            const nm = String(total % 60).padStart(2, "0");
            return (
              <li key={t} className="rounded-2xl border border-black/8 bg-white p-4">
                <p className="text-[11px] text-muted-foreground">Parada {i + 1}</p>
                <p className="mt-1 font-mono text-[22px] font-semibold">
                  {nh}:{nm}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Plan {t}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

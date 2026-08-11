import { useState } from "react";
import { CalendarPlus, Check, CircleDollarSign, MapPin, Navigation, Store, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const CLIENTS = [
  { id: "bodega-sol", name: "Bodega El Sol", district: "Breña", potential: "Alto", objective: "Reposición" },
  { id: "market-28", name: "Market 28", district: "Jesús María", potential: "Medio", objective: "Nuevo catálogo" },
  { id: "distribuidora-paz", name: "Distribuidora Paz", district: "Pueblo Libre", potential: "Alto", objective: "Cobranza" },
  { id: "comercial-lima", name: "Comercial Lima", district: "Magdalena", potential: "Medio", objective: "Seguimiento" },
] as const;

const TIME_SLOTS = ["08:30", "10:00", "11:30", "14:00", "15:30"] as const;

type Visit = {
  clientId: string;
  time: string;
  completed: boolean;
};

const INITIAL_VISITS: Visit[] = [
  { clientId: "bodega-sol", time: "08:30", completed: true },
  { clientId: "market-28", time: "11:30", completed: false },
];

export function CampoDayPlanner({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [selectedClientId, setSelectedClientId] = useState<string>(CLIENTS[2].id);
  const [selectedTime, setSelectedTime] = useState<string>("14:00");
  const [visits, setVisits] = useState<Visit[]>(INITIAL_VISITS);

  const occupiedTimes = new Set(visits.map((visit) => visit.time));
  const selectedClient = CLIENTS.find((client) => client.id === selectedClientId);
  const canSchedule =
    !occupiedTimes.has(selectedTime) &&
    !visits.some((visit) => visit.clientId === selectedClientId);

  function scheduleVisit() {
    if (!canSchedule) return;
    setVisits((current) =>
      [...current, { clientId: selectedClientId, time: selectedTime, completed: false }].sort((a, b) =>
        a.time.localeCompare(b.time),
      ),
    );
  }

  function toggleCompleted(clientId: string) {
    setVisits((current) =>
      current.map((visit) =>
        visit.clientId === clientId ? { ...visit, completed: !visit.completed } : visit,
      ),
    );
  }

  function removeVisit(clientId: string) {
    setVisits((current) => current.filter((visit) => visit.clientId !== clientId));
  }

  return (
    <section
      id="flow"
      className="border-b border-black/5 py-20 md:py-28"
      style={{ backgroundColor: accent.sectionTint }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent.accent }}>
            Agenda del vendedor
          </p>
          <h2 className={cn(displayClass, "mt-3 text-[clamp(1.9rem,3.5vw,2.65rem)]")}>
            Diseña un día que sí cabe en el mapa.
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
            Elige un cliente, reserva una hora libre y marca la visita cuando termine. La agenda queda visible para vendedor y supervisor.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
          <div className="rounded-3xl border border-black/5 bg-white p-5">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" style={{ color: accent.accent }} />
              <p className="text-[12px] font-semibold">1. Elige el próximo cliente</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {CLIENTS.map((client) => {
                const selected = selectedClientId === client.id;
                const alreadyScheduled = visits.some((visit) => visit.clientId === client.id);
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className="flex items-center gap-3 rounded-2xl border p-3.5 text-left transition"
                    style={{
                      borderColor: selected ? `${accent.accent}66` : "rgba(0,0,0,.06)",
                      backgroundColor: selected ? `${accent.accent}0d` : "transparent",
                    }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${accent.accent}12`, color: accent.accent }}
                    >
                      {alreadyScheduled ? <Check className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{client.name}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {client.district} · {client.objective}
                      </span>
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: accent.accent }}>
                      {client.potential}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-[12px] font-semibold">2. Reserva una hora libre</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIME_SLOTS.map((time) => {
                const occupied = occupiedTimes.has(time);
                return (
                  <button
                    key={time}
                    type="button"
                    disabled={occupied}
                    onClick={() => setSelectedTime(time)}
                    className="rounded-lg border px-3 py-2 font-mono text-[11px] transition disabled:cursor-not-allowed disabled:opacity-35"
                    style={{
                      borderColor: selectedTime === time && !occupied ? accent.accent : "rgba(0,0,0,.08)",
                      color: selectedTime === time && !occupied ? accent.accent : undefined,
                      backgroundColor: selectedTime === time && !occupied ? `${accent.accent}0d` : undefined,
                    }}
                  >
                    {time}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!canSchedule}
              onClick={scheduleVisit}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: accent.accent }}
            >
              <CalendarPlus className="h-4 w-4" />
              Agendar {selectedClient?.name}
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_28px_70px_-45px_var(--lp-accent)]">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ruta de hoy</p>
                <p className="mt-1 text-[14px] font-semibold">Zona oeste · {visits.length} visitas</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Navigation className="h-3.5 w-3.5" style={{ color: accent.accent }} />
                18 km estimados
              </div>
            </div>

            <div className="min-h-[420px] p-5 md:p-6">
              {TIME_SLOTS.map((time) => {
                const visit = visits.find((entry) => entry.time === time);
                const client = CLIENTS.find((entry) => entry.id === visit?.clientId);
                return (
                  <div key={time} className="grid grid-cols-[52px_1fr] gap-3 border-b border-black/[0.045] py-3 last:border-0">
                    <span className="pt-3 font-mono text-[11px] text-muted-foreground">{time}</span>
                    {visit && client ? (
                      <div
                        className={cn(
                          "group flex items-center gap-3 rounded-2xl border p-3.5 transition",
                          visit.completed && "opacity-65",
                        )}
                        style={{
                          borderColor: visit.completed ? `${accent.accent}55` : "rgba(0,0,0,.06)",
                          backgroundColor: visit.completed ? `${accent.accent}0a` : "white",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCompleted(client.id)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                          style={{
                            borderColor: accent.accent,
                            backgroundColor: visit.completed ? accent.accent : "transparent",
                            color: visit.completed ? "white" : accent.accent,
                          }}
                          aria-label={visit.completed ? `Reabrir visita a ${client.name}` : `Completar visita a ${client.name}`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-[13px] font-semibold", visit.completed && "line-through")}>{client.name}</p>
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {client.district} · {client.objective}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVisit(client.id)}
                          className="rounded-lg p-2 text-muted-foreground opacity-60 transition hover:bg-black/[0.04] hover:opacity-100"
                          aria-label={`Quitar visita a ${client.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className="rounded-2xl border border-dashed border-black/10 px-4 py-3 text-left text-[11px] text-muted-foreground transition hover:border-black/20 hover:bg-black/[0.02]"
                      >
                        Hora disponible · tocar para reservar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CampoVisitSignals({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const [focus, setFocus] = useState(0);
  const icons = [MapPin, CircleDollarSign, Check];

  return (
    <section id="campo-senales" className="border-b border-black/5 py-20 md:py-24" style={{ backgroundColor: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent.accent }}>
          Señales desde la calle
        </p>
        <h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3vw,2.4rem)]")}>
          La visita no termina en el check-in.
        </h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {copy.highlights.slice(0, 3).map((h, i) => {
            const Icon = icons[i] ?? Check;
            return (
              <button
                key={h.title}
                type="button"
                onClick={() => setFocus(i)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold",
                  focus === i ? "border-transparent text-white" : "border-black/10 bg-white"
                )}
                style={focus === i ? { backgroundColor: accent.accent } : undefined}
              >
                <Icon className="h-3.5 w-3.5" />
                {h.title}
              </button>
            );
          })}
        </div>
        <p className="mt-5 max-w-2xl text-[14px] text-muted-foreground">{copy.highlights[focus]?.body}</p>
      </div>
    </section>
  );
}

/** Marca cobranza / pedido en la visita. */
export function CampoOutcomeToggle({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [outcome, setOutcome] = useState<"pedido" | "cobranza" | "sin_venta">("pedido");
  const copyMap = {
    pedido: "Se registra el pedido y queda listo para despacho.",
    cobranza: "Se anota el monto cobrado y el saldo pendiente.",
    sin_venta: "Queda el motivo y la próxima fecha sugerida.",
  } as const;

  return (
    <section id="campo-resultado" className="border-b border-black/5 bg-background py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Resultado de visita</p>
        <h2 className={cn(displayClass, "mt-2 text-[clamp(1.5rem,2.8vw,2.1rem)]")}>
          Cierra el resultado en un toque
        </h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              { id: "pedido" as const, label: "Pedido" },
              { id: "cobranza" as const, label: "Cobranza" },
              { id: "sin_venta" as const, label: "Sin venta" },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOutcome(o.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] font-semibold",
                outcome === o.id ? "border-transparent text-white" : "border-black/10 bg-white"
              )}
              style={outcome === o.id ? { backgroundColor: accent.accent } : undefined}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="mt-5 max-w-xl text-[14px] text-muted-foreground">{copyMap[outcome]}</p>
      </div>
    </section>
  );
}

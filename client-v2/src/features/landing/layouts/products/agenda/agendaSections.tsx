import { useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const DIAS = [
  { id: "mar-12", corto: "MAR", numero: "12", etiqueta: "Martes 12" },
  { id: "mie-13", corto: "MIÉ", numero: "13", etiqueta: "Miércoles 13" },
  { id: "jue-14", corto: "JUE", numero: "14", etiqueta: "Jueves 14" },
  { id: "vie-15", corto: "VIE", numero: "15", etiqueta: "Viernes 15" },
] as const;

const HORARIOS = ["09:00", "09:45", "10:30", "11:15", "15:00", "15:45"] as const;
const OCUPADOS: Record<string, readonly string[]> = {
  "mar-12": ["09:45", "11:15"],
  "mie-13": ["10:30"],
  "jue-14": ["09:00", "15:00"],
  "vie-15": ["11:15", "15:45"],
};

type Reserva = {
  dia: (typeof DIAS)[number];
  hora: string;
};

export function AgendaSlotPicker({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [diaId, setDiaId] = useState<(typeof DIAS)[number]["id"]>("mar-12");
  const [hora, setHora] = useState<string | null>(null);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const dia = DIAS.find((item) => item.id === diaId) ?? DIAS[0];

  function elegirDia(id: (typeof DIAS)[number]["id"]) {
    setDiaId(id);
    setHora(null);
    setReserva(null);
  }

  function confirmarReserva() {
    if (!hora) return;
    setReserva({ dia, hora });
  }

  function cambiarReserva() {
    setReserva(null);
  }

  return (
    <section
      id="flow"
      className="border-b border-black/5 py-20 md:py-24"
      style={{ backgroundColor: accent.sectionTint }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: accent.accent }}
          >
            Reserva en tiempo real
          </p>
          <h2 className={cn(displayClass, "mt-3 text-[clamp(1.9rem,3.5vw,2.7rem)] text-balance")}>
            De horario disponible a cita confirmada.
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
            Elige un día, separa una hora libre y confirma. La agenda se actualiza al instante para tu equipo y tu cliente.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-black/8 bg-white shadow-[0_30px_80px_-55px_var(--lp-accent)]">
          <div className="grid lg:grid-cols-[0.62fr_0.38fr]">
            <div className="p-5 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Selecciona fecha y hora
                  </p>
                  <p className="mt-1 text-[15px] font-semibold">Agosto · Lima</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg border border-black/8 p-2 text-muted-foreground"
                    aria-label="Semana anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-black/8 p-2 text-muted-foreground"
                    aria-label="Semana siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-2">
                {DIAS.map((item) => {
                  const activo = diaId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={Boolean(reserva)}
                      onClick={() => elegirDia(item.id)}
                      className="rounded-2xl border px-2 py-3 text-center transition disabled:cursor-not-allowed"
                      style={{
                        borderColor: activo ? accent.accent : "rgba(0,0,0,.08)",
                        backgroundColor: activo ? `${accent.accent}10` : "transparent",
                        color: activo ? accent.accent : undefined,
                      }}
                      aria-pressed={activo}
                    >
                      <span className="block text-[9px] font-semibold tracking-[0.14em]">{item.corto}</span>
                      <span className="mt-1 block font-mono text-xl font-semibold">{item.numero}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 flex items-center gap-2 text-[12px] font-semibold">
                <Clock3 className="h-4 w-4" style={{ color: accent.accent }} />
                Horarios disponibles
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {HORARIOS.map((item) => {
                  const ocupado = OCUPADOS[dia.id]?.includes(item);
                  const activo = hora === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={ocupado || Boolean(reserva)}
                      onClick={() => setHora(item)}
                      className="rounded-xl border px-3 py-3 font-mono text-[12px] transition disabled:cursor-not-allowed disabled:bg-black/[0.025] disabled:text-muted-foreground/40"
                      style={
                        activo
                          ? { borderColor: accent.accent, backgroundColor: accent.accent, color: "white" }
                          : { borderColor: "rgba(0,0,0,.08)" }
                      }
                      aria-pressed={activo}
                    >
                      {ocupado ? "Ocupado" : item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex min-h-[390px] flex-col bg-[#111827] p-6 text-white md:p-8">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent.accent}30`, color: accent.accent }}
                >
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Detalle de la cita</p>
                  <p className="mt-0.5 text-[14px] font-semibold">Consultoría inicial</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <CalendarDays className="h-4 w-4 text-white/45" />
                  <span className="text-[13px]">{dia.etiqueta} de agosto</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Clock3 className="h-4 w-4 text-white/45" />
                  <span className={cn("text-[13px]", !hora && "text-white/40")}>
                    {hora ? `${hora} · 45 minutos` : "Elige una hora disponible"}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <UserRound className="h-4 w-4 text-white/45" />
                  <span className="text-[13px]">Con Mariana Ríos</span>
                </div>
              </div>

              <div className="mt-auto pt-7">
                {reserva ? (
                  <div aria-live="polite">
                    <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: accent.accent }}>
                      <Check className="h-4 w-4" />
                      Reserva confirmada
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-white/50">
                      Enviamos la confirmación y el recordatorio automático al cliente.
                    </p>
                    <button
                      type="button"
                      onClick={cambiarReserva}
                      className="mt-4 w-full rounded-xl border border-white/15 px-4 py-3 text-[12px] font-semibold transition hover:bg-white/5"
                    >
                      Cambiar horario
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!hora}
                    onClick={confirmarReserva}
                    className="w-full rounded-xl px-4 py-3 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-35"
                    style={{ backgroundColor: accent.accent }}
                  >
                    Confirmar reserva
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AgendaReminderBuilder({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [canal, setCanal] = useState<"WhatsApp" | "Correo">("WhatsApp");
  const [anticipacion, setAnticipacion] = useState(24);
  return (
    <section id="recordatorios-agenda" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Recordatorios automáticos</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Reduce ausencias antes de la cita.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-black/8 bg-white p-6"><div className="flex gap-2">{(["WhatsApp", "Correo"] as const).map((item) => <button key={item} type="button" onClick={() => setCanal(item)} className={cn("flex-1 rounded-xl p-3 text-sm font-semibold", canal === item ? "text-white" : "bg-muted")} style={canal === item ? { backgroundColor: accent.accent } : undefined}>{item}</button>)}</div><label className="mt-5 block text-sm">Enviar {anticipacion} h antes<input type="range" min="1" max="48" value={anticipacion} onChange={(event) => setAnticipacion(Number(event.target.value))} className="mt-3 w-full" style={{ accentColor: accent.accent }} /></label></div><div className="rounded-2xl bg-[#111827] p-6 text-white"><p className="text-xs text-white/45">Vista previa · {canal}</p><p className="mt-5 text-sm leading-relaxed">Hola Ana, recuerda tu cita mañana a las 10:30. Confirma desde este mensaje.</p><p className="mt-5 text-xs" style={{ color: accent.accent }}>Programado {anticipacion} h antes</p></div></div>
    </div></section>
  );
}

export function AgendaWaitlistInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [turno, setTurno] = useState(0);
  const espera = ["Lucía · 09:45", "Carlos · 10:30", "Mónica · 15:00"];
  return (
    <section id="lista-espera-agenda" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Lista de espera</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Una cancelación encuentra reemplazo.</h2>
      <div className="mt-8 rounded-2xl border border-black/8 bg-white p-6"><div className="grid gap-2">{espera.map((item, index) => <button key={item} type="button" onClick={() => setTurno(index)} className={cn("flex items-center justify-between rounded-xl border p-4 text-left", turno === index ? "text-white" : "border-black/8")} style={turno === index ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}><span>{item}</span><span className="text-xs">Prioridad {index + 1}</span></button>)}</div><p className="mt-4 text-sm text-muted-foreground">Se ofrecerá el espacio primero a {espera[turno].split(" · ")[0]}.</p></div>
    </div></section>
  );
}

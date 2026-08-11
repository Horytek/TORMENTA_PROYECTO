import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, Hourglass, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

export function PreventaQuotaScrubber({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [reservadas, setReservadas] = useState(320);
  const cupo = 500;
  const porcentaje = (reservadas / cupo) * 100;

  return (
    <section className="border-b border-black/5 py-20 md:py-28" style={{ backgroundColor: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Campaña en vivo</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <h2 className={cn(displayClass, "max-w-2xl text-[clamp(1.9rem,4vw,2.8rem)]")}>Mueve el cupo antes de abrir la preventa.</h2>
          <span className="rounded-full bg-white px-4 py-2 font-mono text-sm shadow-sm">{cupo - reservadas} disponibles</span>
        </div>
        <div className="mt-12 rounded-3xl border border-black/5 bg-white p-7 shadow-[0_24px_60px_-36px_var(--lp-accent)] md:p-10">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs text-muted-foreground">Reservas proyectadas</p><p className="mt-1 font-mono text-4xl font-semibold tabular-nums">{reservadas}</p></div>
            <p className="font-mono text-lg text-muted-foreground">{porcentaje.toFixed(0)}%</p>
          </div>
          <input
            type="range"
            min="0"
            max={cupo}
            step="10"
            value={reservadas}
            onChange={(event) => setReservadas(Number(event.target.value))}
            className="mt-8 h-2 w-full cursor-ew-resize accent-[var(--lp-accent)]"
            aria-label="Reservas proyectadas de la campaña"
          />
          <div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>0 · borrador</span><span>250 · tracción</span><span>500 · agotado</span></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Metrica label="Ingreso comprometido" value={`S/ ${(reservadas * 79).toLocaleString("es-PE")}`} />
            <Metrica label="Stock por producir" value={`${reservadas} un.`} />
            <Metrica label="Restante" value={`${cupo - reservadas} cupos`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metrica({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-black/[0.035] p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-mono text-lg font-semibold">{value}</p></div>;
}

type Pago = "pendiente" | "separado" | "pagado";

export function PreventaPaymentBoard({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [estado, setEstado] = useState<Pago>("separado");
  const estados: Array<{ id: Pago; label: string; detalle: string; icono: typeof Clock3 }> = [
    { id: "pendiente", label: "Pendiente", detalle: "Cupo retenido 15 min", icono: Clock3 },
    { id: "separado", label: "Separado", detalle: "Adelanto de S/ 20", icono: WalletCards },
    { id: "pagado", label: "Pagado", detalle: "Saldo completo", icono: CheckCircle2 },
  ];

  return (
    <section className="border-b border-black/5 py-20 md:py-28" style={{ backgroundColor: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Estado de cobro</p>
            <h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.5vw,2.5rem)]")}>Reserva y pago no significan lo mismo.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Cambia el estado para ver qué recibe el comprador y qué conserva tu operación.</p>
          </div>
          <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-3">
              {estados.map((item) => {
                const Icono = item.icono;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEstado(item.id)}
                    className={cn("rounded-2xl border p-5 text-left transition", estado === item.id ? "text-white shadow-md" : "border-transparent bg-black/[0.03]")}
                    style={estado === item.id ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}
                  >
                    <Icono className="h-5 w-5" />
                    <strong className="mt-4 block text-sm">{item.label}</strong>
                    <span className="mt-1 block text-xs opacity-70">{item.detalle}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed p-5">
              <div><p className="text-xs text-muted-foreground">Orden PV-1084</p><p className="mt-1 font-semibold">Edición fundadores · talla M</p></div>
              <CreditCard className="h-5 w-5" style={{ color: accent.accent }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PreventaCountdown({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [segundos, setSegundos] = useState(5 * 3600 + 42 * 60 + 18);
  const [abierta, setAbierta] = useState(true);

  useEffect(() => {
    if (!abierta) return;
    const timer = window.setInterval(() => setSegundos((valor) => Math.max(0, valor - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [abierta]);

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const resto = segundos % 60;
  const piezas = [horas, minutos, resto];
  const etiquetas = ["horas", "min", "seg"];

  return (
    <section className="relative overflow-hidden border-b border-black/5 bg-[#17131c] py-20 text-white md:py-28">
      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 20% 20%, ${accent.accent}, transparent 35%)` }} aria-hidden />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55"><Hourglass className="h-4 w-4" />Cierre programado</p>
        <h2 className={cn(displayClass, "mx-auto mt-4 max-w-2xl text-[clamp(1.9rem,4vw,2.8rem)] text-white")}>La urgencia tiene una hora real.</h2>
        <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-3">
          {piezas.map((valor, indice) => (
            <div key={etiquetas[indice]} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="font-mono text-4xl font-semibold tabular-nums">{String(valor).padStart(2, "0")}</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-white/45">{etiquetas[indice]}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setAbierta((valor) => !valor)} className="mt-8 rounded-full px-5 py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: accent.accent }}>
          {abierta ? "Pausar reloj demo" : "Continuar reloj demo"}
        </button>
      </div>
    </section>
  );
}

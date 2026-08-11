import { useState } from "react";
import { CarFront, Check, MapPin, Radio, UserRound, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const VIAJE = [
  { id: "solicitud", label: "Solicitud", detail: "San Isidro → Miraflores", icon: MapPin },
  { id: "busqueda", label: "Búsqueda", detail: "3 conductores disponibles", icon: Radio },
  { id: "asignado", label: "Asignado", detail: "Recojo estimado: 4 min", icon: CarFront },
] as const;

const CONDUCTORES = [
  { id: "lucia", nombre: "Lucía R.", placa: "TAX-214", distancia: "1.2 km", viajes: 1284 },
  { id: "diego", nombre: "Diego M.", placa: "TAX-908", distancia: "2.0 km", viajes: 842 },
  { id: "marco", nombre: "Marco P.", placa: "TAX-551", distancia: "2.7 km", viajes: 1560 },
] as const;

export function TaxiDispatchInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [paso, setPaso] = useState(0);
  const [conductor, setConductor] = useState<(typeof CONDUCTORES)[number] | null>(null);

  const avanzar = () => {
    if (paso === 0) setPaso(1);
    if (paso === 1 && conductor) setPaso(2);
  };

  const reiniciar = () => {
    setPaso(0);
    setConductor(null);
  };

  return (
    <section id="flujo" className="border-b border-black/5 py-20 md:py-24" style={{ background: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>
          Sala de despacho
        </p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.2vw,2.5rem)] text-balance")}>
          Del pedido a la unidad asignada.
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">
          Crea el viaje, elige quién lo toma y confirma la salida desde un solo tablero.
        </p>

        <div className="mt-10 grid overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-xl lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-b border-black/8 p-6 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Estado del viaje</p>
            <ol className="mt-6 space-y-3">
              {VIAJE.map((item, index) => {
                const activo = index === paso;
                const completo = index < paso;
                return (
                  <li
                    key={item.id}
                    className={cn("flex gap-3 rounded-2xl border p-4 transition-all", activo ? "shadow-sm" : "border-transparent")}
                    style={activo ? { borderColor: accent.accent, backgroundColor: `${accent.accent}0d` } : undefined}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: completo || activo ? accent.accent : "#e5e7eb", color: completo || activo ? "white" : "#64748b" }}
                    >
                      {completo ? <Check className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{item.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={paso === 2 ? reiniciar : avanzar}
              disabled={paso === 1 && !conductor}
              className="mt-6 w-full rounded-xl px-4 py-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: accent.accent }}
            >
              {paso === 0 ? "Buscar conductor" : paso === 1 ? "Asignar seleccionado" : "Nuevo viaje"}
            </button>
          </div>

          <div className="bg-[#0f172a] p-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Conductores cercanos</p>
                <p className="mt-1 text-[14px] font-semibold">{paso === 0 ? "Crea la solicitud para abrir la sala" : "Selecciona una unidad"}</p>
              </div>
              <UserRound className="h-5 w-5" style={{ color: accent.accent }} />
            </div>
            <div className="mt-5 space-y-3">
              {CONDUCTORES.map((item) => {
                const elegido = conductor?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={paso !== 1}
                    onClick={() => setConductor(item)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all disabled:opacity-35",
                      elegido ? "border-transparent" : "border-white/10 bg-white/5 hover:bg-white/10",
                    )}
                    style={elegido ? { backgroundColor: accent.accent } : undefined}
                  >
                    <span>
                      <span className="block text-[14px] font-semibold">{item.nombre}</span>
                      <span className={cn("mt-1 block text-[11px]", elegido ? "text-white/75" : "text-white/45")}>
                        {item.placa} · {item.viajes} viajes
                      </span>
                    </span>
                    <span className="font-mono text-[12px]">{item.distancia}</span>
                  </button>
                );
              })}
            </div>
            {paso === 2 && conductor ? (
              <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-[12px] text-white/70">
                {conductor.nombre} recibió el viaje en {conductor.placa}. El operador conserva el control.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TaxiFareZoneInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [zona, setZona] = useState<"regular" | "aeropuerto">("regular");
  const [demandaAlta, setDemandaAlta] = useState(false);
  const base = zona === "regular" ? 12 : 28;
  const total = base + (demandaAlta ? 6 : 0);
  return (
    <section id="tarifas-zonas" className="border-b border-black/5 bg-background py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Tarifas por zona</p>
        <h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Define la regla. Mira la tarifa.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-black/8 bg-white p-5">
            <div className="grid grid-cols-2 gap-2">{(["regular", "aeropuerto"] as const).map((item) => <button key={item} type="button" onClick={() => setZona(item)} className={cn("rounded-xl border p-4 text-sm font-semibold capitalize", zona === item ? "text-white" : "border-black/8")} style={zona === item ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}>{item}</button>)}</div>
            <button type="button" aria-pressed={demandaAlta} onClick={() => setDemandaAlta((value) => !value)} className="mt-4 flex w-full items-center justify-between rounded-xl bg-muted/50 p-4 text-sm"><span>Demanda alta</span><span className={cn("rounded-full px-3 py-1 text-xs", demandaAlta ? "text-white" : "bg-white")} style={demandaAlta ? { backgroundColor: accent.accent } : undefined}>{demandaAlta ? "Activa" : "Normal"}</span></button>
          </div>
          <div className="rounded-2xl bg-[#111827] p-6 text-white"><WalletCards className="h-6 w-6" style={{ color: accent.accent }} /><p className="mt-6 text-xs text-white/45">Tarifa estimada</p><p className="mt-1 font-mono text-5xl font-bold">S/ {total}</p><p className="mt-4 text-sm text-white/60">Zona {zona}{demandaAlta ? " · recargo por demanda" : " · tarifa base"}</p></div>
        </div>
      </div>
    </section>
  );
}

const VIAJES_EN_VIVO = ["TAX-214 recogió en San Isidro", "TAX-551 llegó a Miraflores", "TAX-908 aceptó viaje al Centro"];

export function TaxiLiveTripTicker({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [indice, setIndice] = useState(0);
  return (
    <section id="viajes-en-vivo" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Pulso de operación</p>
        <h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Los viajes se mueven en vivo.</h2>
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-black/8 bg-white p-6 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: accent.accent }}><Radio className="h-5 w-5" /></span>
          <div className="flex-1"><p className="text-xs text-muted-foreground">Evento #{indice + 1}</p><p aria-live="polite" className="mt-1 font-semibold">{VIAJES_EN_VIVO[indice]}</p></div>
          <button type="button" onClick={() => setIndice((value) => (value + 1) % VIAJES_EN_VIVO.length)} className="rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: accent.accent }}>Siguiente evento</button>
        </div>
      </div>
    </section>
  );
}

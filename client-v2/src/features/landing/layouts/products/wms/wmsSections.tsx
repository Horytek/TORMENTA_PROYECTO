import { useState } from "react";
import { Box, Check, MapPin, RotateCcw, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const LOCATIONS = [
  { id: "A-03-02", label: "Rack A · Nivel 3", stock: 18 },
  { id: "B-01-04", label: "Rack B · Nivel 1", stock: 7 },
  { id: "C-02-01", label: "Rack C · Nivel 2", stock: 24 },
] as const;

const ITEMS = [
  { id: "SKU-1842", name: "Filtro industrial 20 cm", order: "#PV-0918" },
  { id: "SKU-7730", name: "Kit de sello hidráulico", order: "#PV-0921" },
  { id: "SKU-4405", name: "Rodamiento reforzado", order: "#PV-0924" },
] as const;

type FlowStep = "location" | "item" | "confirm" | "done";

export function WmsPickingSimulation({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [step, setStep] = useState<FlowStep>("location");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);

  const selectedLocation = LOCATIONS.find((location) => location.id === locationId);
  const selectedItem = ITEMS.find((item) => item.id === itemId);

  function chooseLocation(id: string) {
    setLocationId(id);
    setStep("item");
  }

  function chooseItem(id: string) {
    setItemId(id);
    setStep("confirm");
  }

  function reset() {
    setLocationId(null);
    setItemId(null);
    setStep("location");
  }

  return (
    <section
      id="flow"
      className="border-b border-black/5 py-20 md:py-28"
      style={{ backgroundColor: accent.sectionTint }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent.accent }}>
              Simulación de picking
            </p>
            <h2 className={cn(displayClass, "mt-3 text-[clamp(1.9rem,3.5vw,2.65rem)]")}>
              Ubica. Escanea. Confirma.
            </h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
              Sigue una tarea como lo haría el operario: primero valida el bin, luego el artículo y cierra el movimiento.
            </p>

            <ol className="mt-8 space-y-3" aria-label="Progreso de la simulación">
              {[
                { id: "location", label: "Validar ubicación", icon: MapPin },
                { id: "item", label: "Escanear artículo", icon: ScanLine },
                { id: "confirm", label: "Confirmar movimiento", icon: Check },
              ].map((entry, index) => {
                const order: FlowStep[] = ["location", "item", "confirm", "done"];
                const complete = order.indexOf(step) > index;
                const active = order.indexOf(step) === index;
                const Icon = entry.icon;

                return (
                  <li
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                      active ? "bg-white" : "border-transparent",
                    )}
                    style={active ? { borderColor: `${accent.accent}55` } : undefined}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: complete || active ? `${accent.accent}18` : "rgba(0,0,0,.04)",
                        color: complete || active ? accent.accent : undefined,
                      }}
                    >
                      {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className={cn("text-[13px] font-medium", !active && !complete && "text-muted-foreground")}>
                      {entry.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_28px_70px_-45px_var(--lp-accent)]">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Tarea PK-2048
                </p>
                <p className="mt-1 text-[14px] font-semibold">Ola de salida · Turno mañana</p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-black/[0.04]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reiniciar
              </button>
            </div>

            <div className="min-h-[390px] p-5 md:p-7">
              {step === "location" ? (
                <>
                  <p className="text-[13px] font-semibold">¿En qué ubicación estás?</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">Selecciona el código leído en el rack.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {LOCATIONS.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => chooseLocation(location.id)}
                        className="rounded-2xl border border-black/5 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <MapPin className="h-5 w-5" style={{ color: accent.accent }} />
                        <p className="mt-5 font-mono text-[18px] font-semibold">{location.id}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{location.label}</p>
                        <p className="mt-4 text-[11px] font-medium">{location.stock} unidades disponibles</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === "item" ? (
                <>
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: `${accent.accent}10` }}>
                    <p className="text-[11px] text-muted-foreground">Ubicación validada</p>
                    <p className="mt-1 font-mono text-[15px] font-semibold" style={{ color: accent.accent }}>
                      {selectedLocation?.id}
                    </p>
                  </div>
                  <p className="mt-6 text-[13px] font-semibold">Escanea el artículo solicitado</p>
                  <div className="mt-4 space-y-3">
                    {ITEMS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => chooseItem(item.id)}
                        className="flex w-full items-center gap-4 rounded-2xl border border-black/5 p-4 text-left transition hover:border-black/15"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.04]">
                          <Box className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[11px]" style={{ color: accent.accent }}>
                            {item.id}
                          </span>
                          <span className="mt-1 block truncate text-[13px] font-semibold">{item.name}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">{item.order}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === "confirm" ? (
                <div className="flex min-h-[330px] flex-col justify-center">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-black/[0.035] p-5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Origen</p>
                      <p className="mt-3 font-mono text-[20px] font-semibold">{selectedLocation?.id}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{selectedLocation?.label}</p>
                    </div>
                    <div className="rounded-2xl bg-black/[0.035] p-5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Artículo</p>
                      <p className="mt-3 font-mono text-[13px] font-semibold">{selectedItem?.id}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{selectedItem?.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("done")}
                    className="mt-5 rounded-xl px-5 py-3 text-[13px] font-semibold text-white transition active:scale-[0.99]"
                    style={{ backgroundColor: accent.accent }}
                  >
                    Confirmar picking de 1 unidad
                  </button>
                </div>
              ) : null}

              {step === "done" ? (
                <div className="flex min-h-[330px] flex-col items-center justify-center text-center" role="status">
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accent.accent}18`, color: accent.accent }}
                  >
                    <Check className="h-8 w-8" />
                  </span>
                  <h3 className="mt-5 text-[20px] font-semibold">Movimiento confirmado</h3>
                  <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
                    El stock quedó actualizado y la tarea PK-2048 está lista para la siguiente línea.
                  </p>
                  <button type="button" onClick={reset} className="mt-6 text-[13px] font-semibold" style={{ color: accent.accent }}>
                    Simular otra tarea
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WmsOperationalSnapshot({ module }: { module: LandingProductModule }) {
  const { accent, displayClass, copy } = useLayoutChrome(module);
  const [pick, setPick] = useState(0);

  return (
    <section id="wms-control" className="border-b border-black/5 py-20 md:py-24" style={{ backgroundColor: accent.surface }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent.accent }}>
          Control por ubicación
        </p>
        <h2 className={cn(displayClass, "mt-3 max-w-xl text-[clamp(1.8rem,3vw,2.4rem)]")}>
          El inventario se mueve con evidencia.
        </h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {copy.highlights.slice(0, 3).map((highlight, index) => (
            <button
              key={highlight.title}
              type="button"
              onClick={() => setPick(index)}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] font-semibold transition-all",
                pick === index ? "border-transparent text-white" : "border-black/10 bg-white text-foreground/70"
              )}
              style={pick === index ? { backgroundColor: accent.accent } : undefined}
            >
              {highlight.title}
            </button>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {copy.highlights[pick]?.body}
        </p>
      </div>
    </section>
  );
}

/** Escáner de ubicación: escribe/elige bin y valida. */
export function WmsBinScanner({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const bins = ["A-01-02", "B-03-01", "C-02-04"];
  const [typed, setTyped] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);

  return (
    <section id="wms-scan" className="border-b border-black/5 bg-background py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Escaneo
        </p>
        <h2 className={cn(displayClass, "mt-2 text-[clamp(1.5rem,2.8vw,2.1rem)]")}>
          Valida el bin antes de mover
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            {bins.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setTyped(b);
                  setOk(null);
                }}
                className="block w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-left font-mono text-[13px] hover:border-black/20"
              >
                {b}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-black/8 bg-white p-5">
            <label className="text-[12px] text-muted-foreground">Código escaneado</label>
            <input
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value.toUpperCase());
                setOk(null);
              }}
              className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 font-mono text-[14px]"
              placeholder="A-01-02"
            />
            <button
              type="button"
              className="mt-4 rounded-xl px-4 py-2 text-[13px] font-semibold text-white"
              style={{ backgroundColor: accent.accent }}
              onClick={() => setOk(bins.includes(typed.trim()))}
            >
              Validar
            </button>
            {ok === true ? (
              <p className="mt-3 text-[13px] font-medium" style={{ color: accent.accent }}>
                Bin OK · puedes confirmar el picking
              </p>
            ) : null}
            {ok === false ? (
              <p className="mt-3 text-[13px] font-medium text-rose-600">Bin no existe en el mapa</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

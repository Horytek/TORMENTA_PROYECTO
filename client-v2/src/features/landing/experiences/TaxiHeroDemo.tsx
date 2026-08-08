import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

export function TaxiHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [requested, setRequested] = useState(false);
  const [driverReady, setDriverReady] = useState(false);

  function solicitar() {
    setRequested(true);
    setDriverReady(false);
    window.setTimeout(() => setDriverReady(true), 650);
  }

  function reiniciar() {
    setRequested(false);
    setDriverReady(false);
  }

  return (
    <DemoShell accent={accent} theme={theme} label="Taxi · mapa en vivo">
      <div className="relative h-[280px] overflow-hidden border border-white/10 bg-black/30">
        {/* map-like grid cells */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-5 gap-px opacity-40">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/[0.04] transition-colors duration-500"
              style={
                requested && [7, 8, 13, 14, 19].includes(i)
                  ? { backgroundColor: `${accent}33` }
                  : undefined
              }
            />
          ))}
        </div>

        <div className="absolute left-[18%] top-[62%] flex flex-col items-center transition-transform duration-500">
          <MapPin className="h-5 w-5" style={{ color: accent }} />
          <span className="mt-0.5 text-[10px] text-white/60">Origen</span>
        </div>
        <div className="absolute right-[16%] top-[28%] flex flex-col items-center">
          <MapPin className="h-5 w-5 text-white/70" />
          <span className="mt-0.5 text-[10px] text-white/60">Destino</span>
        </div>

        {/* animated path */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M20 65 C 35 55, 45 40, 80 30"
            fill="none"
            stroke={accent}
            strokeWidth="1.2"
            strokeDasharray="120"
            strokeDashoffset={requested ? 0 : 120}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
            opacity={requested ? 0.9 : 0.25}
          />
        </svg>

        {driverReady ? (
          <div
            className="absolute left-[42%] top-[42%] flex items-center gap-2 border px-2.5 py-1.5 text-[11px] shadow-lg transition-all duration-500"
            style={{ borderColor: `${accent}80`, backgroundColor: `${accent}22` }}
          >
            <Navigation className="h-3.5 w-3.5" style={{ color: accent }} />
            <span>Conductor asignado · 4 min</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <AccentBtn accent={accent} theme={theme} onClick={solicitar}>
          Solicitar viaje
        </AccentBtn>
        {requested ? (
          <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={reiniciar}>
            Nuevo viaje
          </AccentBtn>
        ) : null}
        <span className="text-[11px] text-white/45">
          {driverReady ? "Ruta dibujada" : requested ? "Buscando…" : "Toca para pedir"}
        </span>
      </div>
    </DemoShell>
  );
}

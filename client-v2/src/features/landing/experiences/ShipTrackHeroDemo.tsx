import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const EVENTS = [
  { t: "08:12", label: "Recolectado en almacén" },
  { t: "10:40", label: "En tránsito a hub" },
  { t: "14:05", label: "En ruta de entrega" },
  { t: "16:22", label: "Entregado al destinatario" },
] as const;

export function ShipTrackHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [count, setCount] = useState(1);

  return (
    <DemoShell accent={accent} theme={theme} label="Envíos · tracking">
      <p className="mb-3 font-mono text-[11px] text-white/45">Guía HT-90421</p>
      <ol className="relative space-y-0 border-l border-white/15 pl-4">
        {EVENTS.slice(0, count).map((ev, i) => (
          <li
            key={ev.label}
            className="relative pb-4 transition-all duration-500"
            style={{ opacity: 1, transform: "translateY(0)" }}
          >
            <span
              className="absolute -left-[1.15rem] top-1 h-2.5 w-2.5 rounded-full transition-colors duration-300"
              style={{ backgroundColor: i === count - 1 ? accent : "rgba(255,255,255,0.35)" }}
            />
            <p className="font-mono text-[10px] text-white/40">{ev.t}</p>
            <p className="text-[13px] font-medium">{ev.label}</p>
          </li>
        ))}
      </ol>

      <div className="mt-1 flex gap-2">
        <AccentBtn
          accent={accent}
          onClick={() => setCount((c) => Math.min(c + 1, EVENTS.length))}
        >
          Siguiente evento
        </AccentBtn>
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setCount(1)}>
          Reiniciar
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

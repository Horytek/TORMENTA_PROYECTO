import { useState } from "react";
import { MapPin } from "lucide-react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

export function OpsFieldHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [checks, setChecks] = useState(0);
  const [pinDrop, setPinDrop] = useState(false);

  function checkIn() {
    setPinDrop(true);
    setChecks((n) => n + 1);
    window.setTimeout(() => setPinDrop(false), 500);
  }

  return (
    <DemoShell accent={accent} theme={theme} label="Campo · check-in">
      <div className="relative h-[200px] overflow-hidden border border-white/10 bg-black/30">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 55%, ${accent}66, transparent 45%)`,
          }}
        />
        <div
          className={`absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-full transition-all duration-500 ${
            pinDrop ? "scale-125 -translate-y-[110%]" : "scale-100"
          }`}
        >
          <MapPin className="h-10 w-10 drop-shadow-lg" style={{ color: accent }} fill={accent} fillOpacity={0.35} />
        </div>
        <p className="absolute bottom-3 left-3 text-[11px] text-white/50">Cliente · Miraflores</p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Visitas hoy</p>
          <p
            className="mt-1 font-mono text-4xl font-semibold tabular-nums transition-all duration-300"
            style={{ color: accent }}
          >
            {checks}
          </p>
        </div>
        <div className="flex gap-2">
          <AccentBtn accent={accent} theme={theme} onClick={checkIn}>
            Check-in
          </AccentBtn>
          <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setChecks(0)}>
            Limpiar
          </AccentBtn>
        </div>
      </div>
    </DemoShell>
  );
}

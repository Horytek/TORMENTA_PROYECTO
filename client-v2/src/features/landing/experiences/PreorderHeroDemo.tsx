import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const INITIAL_CUPO = 24;

export function PreorderHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [cupo, setCupo] = useState(INITIAL_CUPO);
  const [pulse, setPulse] = useState(false);

  function reservar() {
    if (cupo <= 0) return;
    setCupo((c) => c - 1);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 400);
  }

  return (
    <DemoShell accent={accent} theme={theme} label="Preventa · cupo">
      <div className="border border-white/10 bg-black/25 p-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
          Edición limitada
        </p>
        <p className="mt-2 text-[18px] font-semibold">Colección Invierno</p>
        <p
          className={`mt-4 font-mono text-5xl font-semibold tabular-nums transition-all duration-300 ${
            pulse ? "scale-110" : "scale-100"
          }`}
          style={{ color: accent }}
        >
          {cupo}
        </p>
        <p className="mt-1 text-[12px] text-white/50">cupos restantes</p>

        <div className="mx-auto mt-4 h-2 w-full max-w-[200px] overflow-hidden bg-white/10">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(cupo / INITIAL_CUPO) * 100}%`,
              backgroundColor: accent,
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <AccentBtn accent={accent} theme={theme} onClick={reservar}>
          Reservar
        </AccentBtn>
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setCupo(INITIAL_CUPO)}>
          Reset cupo
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

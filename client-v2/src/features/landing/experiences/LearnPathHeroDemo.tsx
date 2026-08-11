import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const MODULES = ["Introducción", "Operación", "Cierre"] as const;

export function LearnPathHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [done, setDone] = useState<boolean[]>([false, false, false]);

  const progress = Math.round((done.filter(Boolean).length / MODULES.length) * 100);

  function toggle(i: number) {
    setDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  return (
    <DemoShell accent={accent} theme={theme} label="Academia · ruta">
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-[11px]">
          <span className="uppercase tracking-[0.14em] text-white/45">Progreso</span>
          <span className="font-mono tabular-nums" style={{ color: accent }}>
            {progress}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden bg-white/10">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: accent }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {MODULES.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-center justify-between border border-white/10 px-3 py-2.5 text-left text-[13px] transition-all duration-300"
              style={{
                backgroundColor: done[i] ? `${accent}22` : "rgba(0,0,0,0.25)",
                borderColor: done[i] ? accent : undefined,
              }}
            >
              <span>
                Módulo {i + 1}: {label}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/45">
                {done[i] ? "Listo" : "Abrir"}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <AccentBtn
          accent={accent}
          variant="ghost"
          onClick={() => setDone([false, false, false])}
        >
          Reset progreso
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

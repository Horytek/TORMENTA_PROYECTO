import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const STEPS = ["Diagnóstico", "Repuestos", "Ejecución", "QA"] as const;

export function PlantOtHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [step, setStep] = useState(0);
  const pct = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <DemoShell accent={accent} theme={theme} label="Mantto · orden preventiva">
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--demo-border)", background: "var(--demo-panel)" }}
      >
        <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--demo-muted)" }}>
          OT-118
        </p>
        <p className="mt-1 text-[15px] font-semibold">Compresor línea B</p>
        <p className="mt-1 text-[11px]" style={{ color: "var(--demo-muted)" }}>
          Preventivo · Técnico PIN 4412
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[11px]">
            <span style={{ color: "var(--demo-muted)" }}>{STEPS[step]}</span>
            <span className="font-mono tabular-nums" style={{ color: accent }}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%`, backgroundColor: accent }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <AccentBtn
          accent={accent}
          theme={theme}
          onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
        >
          Completar paso
        </AccentBtn>
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setStep(0)}>
          Reiniciar OT
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

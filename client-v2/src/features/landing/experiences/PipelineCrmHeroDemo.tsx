import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const STAGES = ["Prospecto", "Calificado", "Propuesta", "Ganado"] as const;

export function PipelineCrmHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [stage, setStage] = useState(0);

  return (
    <DemoShell accent={accent} theme={theme} label="CRM · deal">
      <button
        type="button"
        onClick={() => setStage((s) => (s + 1) % STAGES.length)}
        className="w-full border border-white/15 bg-black/30 p-4 text-left transition-all duration-300 hover:bg-black/40 active:scale-[0.99]"
        style={{ boxShadow: `inset 4px 0 0 ${accent}` }}
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Deal</p>
        <p className="mt-1 text-[16px] font-semibold">Distribuidora Norte</p>
        <p className="mt-1 font-mono text-[13px]" style={{ color: accent }}>
          S/ 12,400
        </p>
        <p className="mt-3 text-[12px] text-white/55">
          Etapa: <span className="font-semibold text-white">{STAGES[stage]}</span>
        </p>
      </button>

      <div className="mt-4 flex gap-1">
        {STAGES.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStage(i)}
            className="h-1.5 flex-1 transition-all duration-500"
            style={{
              backgroundColor: i <= stage ? accent : "rgba(255,255,255,0.12)",
            }}
            aria-label={label}
          />
        ))}
      </div>

      <div className="mt-3">
        <AccentBtn
          accent={accent}
          onClick={() => setStage((s) => Math.min(s + 1, STAGES.length - 1))}
        >
          Avanzar etapa
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

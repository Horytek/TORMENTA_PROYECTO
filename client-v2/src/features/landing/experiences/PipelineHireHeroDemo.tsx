import { useState } from "react";
import { User } from "lucide-react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const STAGES = ["Postula", "Filtro", "Entrevista", "Oferta"] as const;

export function PipelineHireHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [stage, setStage] = useState(0);

  return (
    <DemoShell accent={accent} theme={theme} label="Recluta · candidato">
      <div className="border border-white/10 bg-black/25 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center transition-colors duration-300"
            style={{ backgroundColor: `${accent}30` }}
          >
            <User className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-[15px] font-semibold">Ana Quispe</p>
            <p className="text-[11px] text-white/50">Operaciones · Lima</p>
          </div>
        </div>

        <ol className="mt-4 grid grid-cols-4 gap-1.5">
          {STAGES.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStage(i)}
                className="w-full border px-1 py-2 text-center text-[10px] font-medium transition-all duration-300"
                style={{
                  borderColor: i === stage ? accent : "rgba(255,255,255,0.1)",
                  backgroundColor: i <= stage ? `${accent}28` : "transparent",
                  color: i <= stage ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-3 flex gap-2">
        <AccentBtn
          accent={accent}
          onClick={() => setStage((s) => Math.min(s + 1, STAGES.length - 1))}
        >
          Avanzar candidato
        </AccentBtn>
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setStage(0)}>
          Reiniciar
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

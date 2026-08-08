import { useState } from "react";
import { Package } from "lucide-react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const STEPS = ["Recibido", "Preparando", "En camino", "Entregado"] as const;

export function DeliveryHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [step, setStep] = useState(0);

  return (
    <DemoShell accent={accent} theme={theme} label="Delivery · estado del pedido">
      <div className="flex items-start gap-3 border border-white/10 bg-black/25 p-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center transition-colors duration-300"
          style={{ backgroundColor: `${accent}30` }}
        >
          <Package className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold">Pedido #4821</p>
          <p className="mt-0.5 text-[11px] text-white/50">Av. Arequipa 120 · S/ 48.90</p>
        </div>
      </div>

      <ol className="mt-4 space-y-2">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className="flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-all duration-300"
                style={{
                  borderColor: active ? accent : "rgba(255,255,255,0.1)",
                  backgroundColor: active ? `${accent}22` : done ? "rgba(255,255,255,0.04)" : "transparent",
                }}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center text-[11px] font-bold transition-colors duration-300"
                  style={{
                    backgroundColor: done || active ? accent : "rgba(255,255,255,0.08)",
                    color: done || active ? "#0c0f12" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-[13px] font-medium">{label}</span>
                {active ? (
                  <span className="ml-auto text-[10px] uppercase tracking-wider" style={{ color: accent }}>
                    Actual
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex gap-2">
        <AccentBtn
          accent={accent}
          onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
        >
          Avanzar estado
        </AccentBtn>
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setStep(0)}>
          Reiniciar
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

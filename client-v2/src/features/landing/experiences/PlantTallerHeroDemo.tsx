import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const STEPS = ["Corte", "Ensamble", "Acabado", "Entrega"] as const;
const INSUMOS = [
  { name: "Tela base", qty: "12 m" },
  { name: "Hilo 40", qty: "2 u" },
  { name: "Etiqueta", qty: "24 u" },
];

export function PlantTallerHeroDemo({ accent, theme = "warm" }: DemoProps) {
  const [step, setStep] = useState(0);
  const [used, setUsed] = useState(false);
  const pct = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <DemoShell accent={accent} theme={theme} label="Taller · OT de producción">
      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--demo-border)", background: "var(--demo-panel)" }}
      >
        <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--demo-muted)" }}>
          OT-P-204
        </p>
        <p className="mt-1 text-[15px] font-semibold">Lote polo oversize · 24 u</p>
        <p className="mt-1 text-[11px]" style={{ color: "var(--demo-muted)" }}>
          Producción · Línea 2
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

        <ul className="mt-4 space-y-1.5">
          {INSUMOS.map((i) => (
            <li
              key={i.name}
              className="flex justify-between rounded-lg px-2 py-1.5 text-[12px]"
              style={{
                background: used ? `${accent}18` : "transparent",
                color: "var(--demo-fg)",
              }}
            >
              <span>{i.name}</span>
              <span className="font-mono tabular-nums" style={{ color: "var(--demo-muted)" }}>
                {i.qty}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <AccentBtn
          accent={accent}
          theme={theme}
          onClick={() => {
            setUsed(true);
            setStep((s) => Math.min(s + 1, STEPS.length - 1));
          }}
        >
          Avanzar producción
        </AccentBtn>
        <AccentBtn
          accent={accent}
          theme={theme}
          variant="ghost"
          onClick={() => {
            setStep(0);
            setUsed(false);
          }}
        >
          Reiniciar OT
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

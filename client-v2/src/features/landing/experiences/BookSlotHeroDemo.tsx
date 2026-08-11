import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const SLOTS = ["09:00", "10:30", "12:00", "15:00", "16:30", "18:00"];

export function BookSlotHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <DemoShell accent={accent} theme={theme} label="Agenda · horarios">
      <p className="mb-3 text-[12px] text-white/50">Martes 12 · Dra. Ríos</p>
      <div className="grid grid-cols-3 gap-2">
        {SLOTS.map((slot) => {
          const active = selected === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => setSelected(slot)}
              className="border px-2 py-3 font-mono text-[13px] tabular-nums transition-all duration-300 active:scale-[0.97]"
              style={{
                borderColor: active ? accent : "rgba(255,255,255,0.12)",
                backgroundColor: active ? accent : "rgba(0,0,0,0.3)",
                color: active ? "#0c0f12" : "rgba(255,255,255,0.85)",
              }}
            >
              {slot}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[12px] text-white/55 transition-opacity duration-300">
        {selected ? (
          <>
            Reservado: <span className="font-semibold text-white">{selected}</span>
          </>
        ) : (
          "Elige un horario"
        )}
      </p>

      <div className="mt-3">
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setSelected(null)}>
          Quitar selección
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

type Lane = "recepcion" | "ubicacion" | "picking";

const LANES: { id: Lane; title: string }[] = [
  { id: "recepcion", title: "Recepción" },
  { id: "ubicacion", title: "Ubicación" },
  { id: "picking", title: "Picking" },
];

const INITIAL: { id: string; title: string; lane: Lane }[] = [
  { id: "w1", title: "Lote inbound #44", lane: "recepcion" },
  { id: "w2", title: "SKU A-12 → Bin R2", lane: "ubicacion" },
  { id: "w3", title: "Ola mañana · 18 líneas", lane: "picking" },
];

function nextLane(lane: Lane): Lane {
  if (lane === "recepcion") return "ubicacion";
  if (lane === "ubicacion") return "picking";
  return "recepcion";
}

export function OpsWmsHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [cards, setCards] = useState(INITIAL);

  function move(id: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, lane: nextLane(c.lane) } : c)),
    );
  }

  return (
    <DemoShell accent={accent} theme={theme} label="WMS · olas de almacén">
      <div className="grid grid-cols-3 gap-2">
        {LANES.map((lane) => (
          <div
            key={lane.id}
            className="min-h-[220px] rounded-xl border p-2"
            style={{ borderColor: "var(--demo-border)", background: "var(--demo-panel)" }}
          >
            <p
              className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--demo-muted)" }}
            >
              {lane.title}
            </p>
            <div className="space-y-2">
              {cards
                .filter((c) => c.lane === lane.id)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => move(c.id)}
                    className="w-full rounded-lg border px-2.5 py-2 text-left text-[12px] font-medium transition-all duration-300 active:scale-[0.98]"
                    style={{
                      borderColor: "var(--demo-border)",
                      background: theme === "ink" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                      boxShadow: c.lane === "picking" ? `inset 3px 0 0 ${accent}` : undefined,
                    }}
                  >
                    {c.title}
                    <span className="mt-1 block text-[10px]" style={{ color: "var(--demo-muted)" }}>
                      Clic → siguiente
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setCards(INITIAL)}>
          Reset olas
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

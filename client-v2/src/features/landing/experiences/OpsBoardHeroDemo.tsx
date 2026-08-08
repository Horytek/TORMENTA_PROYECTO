import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

type Lane = "por_asignar" | "en_ruta" | "entregado";

const LANES: { id: Lane; title: string }[] = [
  { id: "por_asignar", title: "Por asignar" },
  { id: "en_ruta", title: "En ruta" },
  { id: "entregado", title: "Entregado" },
];

const INITIAL: { id: string; title: string; lane: Lane }[] = [
  { id: "d1", title: "Parada · Miraflores 12", lane: "por_asignar" },
  { id: "d2", title: "Ruta Sur · Chofer Ana", lane: "en_ruta" },
  { id: "d3", title: "Parada · Surco 4", lane: "por_asignar" },
];

function nextLane(lane: Lane): Lane {
  if (lane === "por_asignar") return "en_ruta";
  if (lane === "en_ruta") return "entregado";
  return "por_asignar";
}

/** Demo de Despacho: paradas / ruta (no WMS). */
export function OpsBoardHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [cards, setCards] = useState(INITIAL);

  function move(id: string) {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, lane: nextLane(c.lane) } : c)),
    );
  }

  return (
    <DemoShell accent={accent} theme={theme} label="Despacho · paradas del día">
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
                      boxShadow: c.lane === "en_ruta" ? `inset 3px 0 0 ${accent}` : undefined,
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
          Reset ruta
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

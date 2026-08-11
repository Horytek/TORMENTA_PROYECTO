import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const ROWS = [
  { id: "p1", name: "Harina 50kg", price: 89 },
  { id: "p2", name: "Aceite 20L", price: 124 },
  { id: "p3", name: "Azúcar 25kg", price: 72 },
];

export function CommerceB2bHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [qty, setQty] = useState<Record<string, number>>({
    p1: 0,
    p2: 0,
    p3: 0,
  });

  const total = ROWS.reduce((sum, r) => sum + r.price * (qty[r.id] ?? 0), 0);
  const units = Object.values(qty).reduce((a, b) => a + b, 0);

  function bump(id: string, delta: number) {
    setQty((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta),
    }));
  }

  return (
    <DemoShell accent={accent} theme={theme} label="Mayorista · lista de precios">
      <ul className="space-y-2">
        {ROWS.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-2 border border-white/10 bg-black/25 px-3 py-2.5"
          >
            <div>
              <p className="text-[13px] font-medium">{row.name}</p>
              <p className="text-[11px] text-white/45">S/ {row.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Restar"
                onClick={() => bump(row.id, -1)}
                className="flex h-7 w-7 items-center justify-center border border-white/15 text-white/70 transition-colors duration-200 hover:bg-white/10"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center font-mono text-[13px] tabular-nums">
                {qty[row.id] ?? 0}
              </span>
              <button
                type="button"
                aria-label="Sumar"
                onClick={() => bump(row.id, 1)}
                className="flex h-7 w-7 items-center justify-center transition-colors duration-200"
                style={{ backgroundColor: accent, color: "#0c0f12" }}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border border-white/10 bg-white/[0.04] px-3 py-3">
        <div className="flex items-center gap-2 text-[12px] text-white/60">
          <ShoppingCart className="h-4 w-4" style={{ color: accent }} />
          {units} ítems
        </div>
        <p className="font-mono text-[18px] font-semibold tabular-nums" style={{ color: accent }}>
          S/ {total.toFixed(2)}
        </p>
      </div>
      <div className="mt-2">
        <AccentBtn
          accent={accent}
          variant="ghost"
          onClick={() => setQty({ p1: 0, p2: 0, p3: 0 })}
        >
          Vaciar carrito
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

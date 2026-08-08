import { useState } from "react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const PRODUCTS = [
  { id: "a", name: "Polo basic", price: 39 },
  { id: "b", name: "Gorra", price: 25 },
  { id: "c", name: "Tote bag", price: 45 },
];

export function CommerceWaHeroDemo({ accent, theme = "paper" }: DemoProps) {
  const [cart, setCart] = useState<{ id: string; name: string; price: number }[]>([]);

  function add(p: (typeof PRODUCTS)[0]) {
    setCart((prev) => [...prev, p]);
  }

  const lines =
    cart.length === 0
      ? "Hola, quiero hacer un pedido…"
      : [
          "Hola, quiero pedir:",
          ...cart.map((c, i) => `${i + 1}. ${c.name} — S/ ${c.price}`),
          "",
          `Total: S/ ${cart.reduce((s, c) => s + c.price, 0)}`,
        ].join("\n");

  return (
    <DemoShell accent={accent} theme={theme} label="Catálogo WA · preview">
      <div className="flex flex-wrap gap-2">
        {PRODUCTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => add(p)}
            className="border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[12px] transition-all duration-300 hover:bg-white/10 active:scale-[0.97]"
            style={{ borderColor: cart.some((c) => c.id === p.id) ? accent : undefined }}
          >
            {p.name}
            <span className="ml-1.5 text-white/45">+S/{p.price}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 border border-white/10 bg-[#075e54]/40 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/45">
          Mensaje WhatsApp
        </p>
        <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-white/85 transition-opacity duration-300">
          {lines}
        </pre>
      </div>

      <div className="mt-3">
        <AccentBtn accent={accent} theme={theme} variant="ghost" onClick={() => setCart([])}>
          Limpiar mensaje
        </AccentBtn>
      </div>
    </DemoShell>
  );
}

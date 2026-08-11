import { useMemo, useState } from "react";
import { MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { AccentBtn, DemoShell, type DemoProps } from "./demoShell";

const PRODUCTS = [
  { id: "a", name: "Polo basic", price: 39, tone: "#0D9488", stock: 12 },
  { id: "b", name: "Gorra mesh", price: 25, tone: "#0F766E", stock: 8 },
  { id: "c", name: "Tote canvas", price: 45, tone: "#134E4A", stock: 5 },
  { id: "d", name: "Calcetín pack", price: 18, tone: "#5EEAD4", stock: 24 },
];

type Line = { id: string; name: string; price: number; qty: number };

/** Preview interactivo: vitrina + carrito → mensaje WhatsApp. */
export function CommerceWaHeroDemo({ accent, theme = "cool" }: DemoProps) {
  const [lines, setLines] = useState<Line[]>([]);

  function add(p: (typeof PRODUCTS)[0]) {
    setLines((prev) => {
      const hit = prev.find((l) => l.id === p.id);
      if (hit) {
        return prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  function bump(id: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.qty, 0),
    [lines]
  );

  const message =
    lines.length === 0
      ? "Hola, quiero hacer un pedido…"
      : [
          "Hola, quiero pedir:",
          ...lines.map((l, i) => `${i + 1}. ${l.name} x${l.qty} — S/ ${l.price * l.qty}`),
          "",
          `Total: S/ ${total}`,
          "¿Tienen delivery hoy?",
        ].join("\n");

  return (
    <DemoShell accent={accent} theme={theme} label="Catálogo WA · preview vivo" className="min-h-[420px]">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--demo-muted)" }}>
              Vitrina pública
            </p>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              <ShoppingBag className="h-3 w-3" />
              {lines.reduce((s, l) => s + l.qty, 0)} ítems
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTS.map((p) => {
              const inCart = lines.find((l) => l.id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(p)}
                  className="group overflow-hidden rounded-xl border text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    borderColor: inCart ? accent : "var(--demo-border)",
                    background: "var(--demo-panel)",
                    boxShadow: inCart ? `0 12px 28px -18px ${accent}` : undefined,
                  }}
                >
                  <div
                    className="relative h-16 overflow-hidden"
                    style={{
                      background: `linear-gradient(145deg, ${p.tone} 0%, color-mix(in srgb, ${p.tone} 40%, #0f172a) 100%)`,
                    }}
                  >
                    <span className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white/80">
                      Stock {p.stock}
                    </span>
                    <span className="absolute right-2 top-2 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      S/ {p.price}
                    </span>
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-[12px] font-semibold leading-tight">{p.name}</p>
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--demo-muted)" }}>
                      {inCart ? `En carrito ×${inCart.qty}` : "Toca para agregar"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {lines.length > 0 ? (
            <ul className="mt-3 space-y-1.5 rounded-xl border px-2.5 py-2" style={{ borderColor: "var(--demo-border)", background: "var(--demo-panel)" }}>
              {lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate font-medium">
                    {l.name} · S/ {l.price * l.qty}
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded-md border p-0.5"
                      style={{ borderColor: "var(--demo-border)" }}
                      onClick={() => bump(l.id, -1)}
                      aria-label="Quitar"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center tabular-nums">{l.qty}</span>
                    <button
                      type="button"
                      className="rounded-md border p-0.5"
                      style={{ borderColor: "var(--demo-border)" }}
                      onClick={() => bump(l.id, 1)}
                      aria-label="Sumar"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col">
          <div
            className="relative flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-[1.35rem] border shadow-lg"
            style={{
              borderColor: "rgba(7,94,84,0.35)",
              background: "linear-gradient(180deg, #075e54 0%, #128c7e 42%, #ece5dd 42%)",
            }}
          >
            <div className="flex items-center gap-2 border-b border-black/10 bg-[#075e54] px-3 py-2.5 text-white">
              <MessageCircle className="h-4 w-4 opacity-90" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold">Tu comercio · WhatsApp</p>
                <p className="text-[10px] text-white/65">Mensaje listo para enviar</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-2 p-3">
              <div className="max-w-[92%] self-end rounded-2xl rounded-br-md bg-[#dcf8c6] px-3 py-2 text-[11px] leading-relaxed text-[#1c1917] shadow-sm transition-all duration-300">
                <pre className="whitespace-pre-wrap font-sans">{message}</pre>
                <p className="mt-1 text-right text-[9px] text-black/35">ahora</p>
              </div>
              {total > 0 ? (
                <p className="text-center text-[10px] font-medium text-[#075e54]/80">
                  Total armado · S/ {total} · sin app del cliente
                </p>
              ) : (
                <p className="text-center text-[10px] text-[#075e54]/70">
                  Agrega productos a la izquierda
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <AccentBtn accent={accent} theme={theme} onClick={() => setLines([])} variant="ghost">
              Limpiar mensaje
            </AccentBtn>
            {lines.length === 0 ? (
              <AccentBtn accent={accent} theme={theme} onClick={() => add(PRODUCTS[0])}>
                Probar con polo
              </AccentBtn>
            ) : null}
          </div>
        </div>
      </div>
    </DemoShell>
  );
}

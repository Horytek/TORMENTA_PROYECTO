import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqBlock({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;
  return (
    <section className="py-10 lg:py-14">
      <div className="max-w-3xl mx-auto px-4 lg:px-8">
        <h2 className="vitrina-section-title text-xl mb-6">Preguntas frecuentes</h2>
        <ul className="divide-y store-hairline border store-hairline rounded-[var(--store-radius-lg)] overflow-hidden bg-[var(--vitrina-elevated)] px-4">
          {items.map((item, i) => (
            <li key={item.q}>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 py-4 text-left min-h-14"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-sm">{item.q}</span>
                <ChevronDown className={`size-4 shrink-0 transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="pb-4 text-sm store-muted leading-relaxed">{item.a}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

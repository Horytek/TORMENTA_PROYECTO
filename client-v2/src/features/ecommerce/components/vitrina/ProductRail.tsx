import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { StoreProducto } from "../../types/storefront";

type Props = {
  title: string;
  eyebrow?: string;
  productos: StoreProducto[];
  slug: string;
  onAdd: (p: StoreProducto) => void;
};

export function ProductRail({ title, eyebrow = "Carrusel", productos, slug, onAdd }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  if (productos.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.75, 360), behavior: "smooth" });
  };

  return (
    <section className="py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
            <h2 className="vitrina-display text-3xl sm:text-4xl mt-1">{title}</h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="size-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-[var(--vitrina-accent)] transition"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="size-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-[var(--vitrina-accent)] transition"
              aria-label="Siguiente"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
        <div
          ref={ref}
          className="flex gap-4 overflow-x-auto vitrina-hide-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0"
        >
          {productos.map((p) => (
            <div key={p.id_producto} className="snap-start shrink-0 w-[min(72vw,260px)]">
              <ProductCard producto={p} slug={slug} onAdd={onAdd} compact />
            </div>
          ))}
          {/* peek spacer */}
          <div className="shrink-0 w-8 sm:w-16" aria-hidden />
        </div>
      </div>
    </section>
  );
}

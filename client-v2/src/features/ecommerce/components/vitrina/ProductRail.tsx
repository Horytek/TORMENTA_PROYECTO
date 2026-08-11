import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCover } from "./ProductCover";
import type { StoreProducto } from "../../types/storefront";

type Props = {
  title: string;
  eyebrow?: string;
  productos: StoreProducto[];
  slug: string;
  onAdd: (p: StoreProducto) => void;
  quickAdd?: boolean;
};

export function ProductRail({ title, eyebrow, productos, slug, onAdd, quickAdd = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  if (productos.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.75, 320), behavior: "smooth" });
  };

  return (
    <section className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            {eyebrow && <p className="text-[11px] uppercase tracking-[0.18em] store-muted">{eyebrow}</p>}
            <h2 className="vitrina-section-title text-xl sm:text-2xl mt-0.5">{title}</h2>
          </div>
          <div className="hidden lg:flex gap-1.5">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="store-icon-btn size-10 border store-hairline bg-[var(--vitrina-elevated)] flex items-center justify-center"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="store-icon-btn size-10 border store-hairline bg-[var(--vitrina-elevated)] flex items-center justify-center"
              aria-label="Siguiente"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
        <div ref={ref} className="store-row-scroll -mx-4 px-4 lg:mx-0 lg:px-0">
          {productos.map((p) => (
            <div key={p.id_producto} className="w-[42vw] sm:w-[180px] lg:w-[200px]">
              <ProductCover producto={p} slug={slug} onAdd={onAdd} quickAdd={quickAdd} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

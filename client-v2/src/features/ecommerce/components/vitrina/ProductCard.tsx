import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { formatPen, getCategoria, type StoreProducto } from "../../types/storefront";

type Props = {
  producto: StoreProducto;
  slug: string;
  onAdd: (p: StoreProducto) => void;
  compact?: boolean;
  index?: number;
};

export function ProductCard({ producto, slug, onAdd, compact = false, index = 0 }: Props) {
  const reduce = useReducedMotion();
  const cat = getCategoria(producto);
  const lowStock = producto.stock > 0 && producto.stock <= 3;

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.28) }}
      className={`vitrina-card group bg-white border border-slate-200/80 overflow-hidden flex flex-col hover:border-[var(--vitrina-accent)]/40 hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-300 ${
        compact ? "" : "h-full"
      }`}
    >
      <Link
        to={`/tienda/${slug}/producto/${producto.id_producto}`}
        className="relative aspect-square bg-slate-100 overflow-hidden block"
      >
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-slate-300 text-sm">Sin foto</div>
        )}
        {lowStock && (
          <span className="absolute top-3 left-3 vitrina-pill bg-[var(--vitrina-ink)] text-white text-[10px] font-semibold px-2.5 py-1">
            Últimas unidades
          </span>
        )}
      </Link>
      <div className={`flex flex-col flex-1 ${compact ? "p-3 gap-1" : "p-4 gap-2"}`}>
        {cat && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{cat}</span>
        )}
        <Link
          to={`/tienda/${slug}/producto/${producto.id_producto}`}
          className={`font-semibold leading-snug hover:text-[var(--vitrina-accent)] transition-colors line-clamp-2 ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          {producto.nombre}
        </Link>
        {!compact && producto.sku && (
          <span className="text-[11px] text-slate-400 font-mono">SKU {producto.sku}</span>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="font-semibold text-lg" style={{ color: "var(--vitrina-accent)" }}>
            {formatPen(Number(producto.precio))}
          </span>
          <button
            type="button"
            onClick={() => onAdd(producto)}
            className="vitrina-pill size-9 flex items-center justify-center text-white shrink-0 hover:opacity-90 transition"
            style={{ background: "var(--vitrina-accent)" }}
            aria-label={`Agregar ${producto.nombre}`}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

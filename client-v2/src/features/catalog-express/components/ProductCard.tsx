import { useState } from "react";
import { Check, Plus, Store } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { CatalogoProducto } from "../types";

const UMBRAL_POCAS = 3;

type Props = {
  producto: CatalogoProducto;
  enCarrito: number;
  onAdd: () => void;
  onQuickView: () => void;
  index?: number;
};

export function ProductCard({ producto: p, enCarrito, onAdd, onQuickView, index = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();
  const imagenPrincipal = p.images?.[0] ?? p.imagen_url;
  const imagenHover = p.images?.[1];
  const showHover = hovered && imagenHover;

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.24) }}
      className="group flex flex-col overflow-hidden rounded-[var(--cx-radius)] border cx-hairline bg-[var(--cx-elevated)] transition-shadow hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onQuickView}
        className="relative aspect-[3/4] bg-[color-mix(in_srgb,var(--cx-ink)_4%,transparent)] overflow-hidden w-full text-left cx-focus"
      >
        {imagenPrincipal ? (
          <img
            src={showHover ? imagenHover! : imagenPrincipal}
            alt={p.descripcion}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center cx-muted/40">
            <Store className="size-10 opacity-30" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {p.stock === 0 ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white">
              Agotado
            </span>
          ) : p.stock <= UMBRAL_POCAS ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/95 text-white">
              Pocas unidades
            </span>
          ) : null}
        </div>

        {p.categoria && (
          <span className="absolute right-2 bottom-2 text-[9px] font-medium bg-black/55 text-white backdrop-blur-sm px-2 py-0.5 rounded-md max-w-[80%] truncate">
            {p.categoria}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {p.nom_marca && (
          <p className="text-[10px] font-semibold tracking-wider cx-muted uppercase">{p.nom_marca}</p>
        )}
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug group-hover:text-[var(--cx-accent)] transition-colors">
          {p.descripcion}
        </h3>

        <div className="mt-auto pt-2 flex items-baseline justify-between gap-1 border-t cx-hairline">
          <span className="text-sm sm:text-base font-bold" style={{ color: "var(--cx-accent)" }}>
            S/ {p.precio.toFixed(2)}
          </span>
          <span className="text-[10px] cx-muted">Stock {p.stock}</span>
        </div>

        <div className="flex gap-1.5 pt-1">
          <button
            type="button"
            disabled={p.stock === 0 || enCarrito >= p.stock}
            onClick={onAdd}
            className="cx-focus h-9 flex-1 text-xs font-semibold rounded-full text-white disabled:opacity-45 inline-flex items-center justify-center gap-1"
            style={{ background: "var(--cx-accent)" }}
          >
            {enCarrito > 0 ? (
              <>
                <Check className="size-3.5" /> ({enCarrito})
              </>
            ) : (
              <>
                <Plus className="size-3.5" /> Agregar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onQuickView}
            className="cx-focus h-9 px-3 text-xs font-medium rounded-full border cx-hairline hover:bg-black/[0.03]"
          >
            Ver
          </button>
        </div>
      </div>
    </motion.article>
  );
}

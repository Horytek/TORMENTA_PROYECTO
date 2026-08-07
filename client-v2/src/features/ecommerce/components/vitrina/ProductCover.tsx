import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { formatPen, getCategoria, type StoreProducto } from "../../types/storefront";

type Props = {
  producto: StoreProducto;
  slug: string;
  onAdd?: (p: StoreProducto) => void;
  quickAdd?: boolean;
  ratio?: "square" | "portrait" | "wide";
  className?: string;
};

const RATIO: Record<NonNullable<Props["ratio"]>, string> = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-video",
};

export function ProductCover({
  producto,
  slug,
  onAdd,
  quickAdd = true,
  ratio = "portrait",
  className = "",
}: Props) {
  const cat = getCategoria(producto);
  const lowStock = producto.stock > 0 && producto.stock <= 3;

  return (
    <article className={`store-cover-hover group ${className}`}>
      <Link
        to={`/tienda/${slug}/producto/${producto.id_producto}`}
        className={`store-cover block ${RATIO[ratio]}`}
      >
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.nombre} loading="lazy" />
        ) : (
          <div className="size-full flex items-center justify-center store-muted text-sm">Sin foto</div>
        )}
        {lowStock && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-1 bg-[var(--vitrina-ink)] text-[var(--vitrina-mist)]">
            Últimas
          </span>
        )}
        {quickAdd && onAdd && producto.stock > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd(producto);
            }}
            className="absolute bottom-2 right-2 size-11 min-h-11 min-w-11 flex items-center justify-center text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition"
            style={{ background: "var(--vitrina-accent)" }}
            aria-label={`Agregar ${producto.nombre}`}
          >
            <Plus className="size-4" />
          </button>
        )}
      </Link>
      <div className="mt-2 space-y-0.5">
        {cat && <p className="text-[10px] uppercase tracking-wider store-muted">{cat}</p>}
        <Link
          to={`/tienda/${slug}/producto/${producto.id_producto}`}
          className="text-sm font-medium leading-snug line-clamp-2 hover:text-[var(--vitrina-accent)]"
        >
          {producto.nombre}
        </Link>
        <p className="text-sm font-semibold" style={{ color: "var(--vitrina-accent)" }}>
          {formatPen(Number(producto.precio))}
        </p>
      </div>
    </article>
  );
}

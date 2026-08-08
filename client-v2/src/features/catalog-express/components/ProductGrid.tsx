import { PackageX } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { CarritoItem, CatalogoProducto } from "../types";

type Props = {
  productos: CatalogoProducto[];
  carrito: CarritoItem[];
  onAdd: (p: CatalogoProducto) => void;
  onQuickView: (p: CatalogoProducto) => void;
  emptyAction?: () => void;
  hasFilters?: boolean;
};

export function ProductGrid({
  productos,
  carrito,
  onAdd,
  onQuickView,
  emptyAction,
  hasFilters,
}: Props) {
  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--cx-radius-lg)] border border-dashed cx-hairline bg-[var(--cx-elevated)] py-20 text-center px-4">
        <div className="rounded-full bg-black/[0.04] p-4">
          <PackageX className="size-10 opacity-35" />
        </div>
        <h3 className="font-semibold text-base">No encontramos productos</h3>
        <p className="text-xs cx-muted max-w-sm">
          Prueba cambiando la búsqueda o ajustando los filtros.
        </p>
        {hasFilters && emptyAction && (
          <button
            type="button"
            onClick={emptyAction}
            className="cx-focus mt-2 text-xs font-medium h-9 px-4 rounded-full border cx-hairline"
          >
            Restablecer filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {productos.map((p, i) => {
        const enCarrito = carrito.find((it) => it.producto.codigo === p.codigo)?.cantidad ?? 0;
        return (
          <ProductCard
            key={p.codigo}
            producto={p}
            enCarrito={enCarrito}
            onAdd={() => onAdd(p)}
            onQuickView={() => onQuickView(p)}
            index={i}
          />
        );
      })}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[var(--cx-radius)] border cx-hairline overflow-hidden bg-[var(--cx-elevated)]">
          <div className="aspect-[3/4] cx-skeleton rounded-none" />
          <div className="p-3.5 space-y-2">
            <div className="h-2.5 w-1/3 cx-skeleton" />
            <div className="h-3 w-full cx-skeleton" />
            <div className="h-3 w-2/3 cx-skeleton" />
            <div className="h-8 w-full cx-skeleton rounded-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

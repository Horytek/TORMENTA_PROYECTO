import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { formatPen, type StoreProducto } from "../types/storefront";
import { BranchAvailabilityBadge } from "./BranchAvailabilityBadge";
import { WhatsAppAssist } from "./WhatsAppAssist";
import type { StoreSucursal } from "../types/storefront";

type Props = {
  producto: StoreProducto;
  slug: string;
  tiendaNombre?: string;
  branch?: StoreSucursal | null;
  telefono?: string | null;
  onAdd?: (p: StoreProducto) => void;
  quickAdd?: boolean;
};

export function ProductCardV2({
  producto,
  slug,
  tiendaNombre,
  branch,
  telefono,
  onAdd,
  quickAdd = true,
}: Props) {
  return (
    <article className="vitrina-card group relative flex flex-col overflow-hidden border store-hairline bg-[var(--vitrina-elevated)]">
      <Link to={`/tienda/${slug}/producto/${producto.id_producto}`} className="block aspect-[4/5] bg-[var(--vitrina-fog)] overflow-hidden">
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.nombre} className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
        ) : (
          <div className="size-full flex items-center justify-center store-muted text-xs">Sin foto</div>
        )}
      </Link>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/tienda/${slug}/producto/${producto.id_producto}`} className="font-semibold text-sm leading-snug line-clamp-2 hover:underline">
            {producto.nombre}
          </Link>
          <BranchAvailabilityBadge disponible={producto.stock} />
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--vitrina-accent)" }}>
          {formatPen(Number(producto.precio))}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-1">
          {quickAdd && onAdd && producto.stock > 0 && (
            <button
              type="button"
              onClick={() => onAdd(producto)}
              className="vitrina-pill inline-flex items-center gap-1 h-9 px-3 text-xs font-semibold text-white"
              style={{ background: "var(--vitrina-accent)" }}
            >
              <Plus className="size-3.5" />
              Agregar
            </button>
          )}
          <WhatsAppAssist
            telefono={telefono}
            tiendaNombre={tiendaNombre}
            branch={branch}
            product={producto}
            label="Consultar"
            className="text-xs"
          />
        </div>
      </div>
    </article>
  );
}

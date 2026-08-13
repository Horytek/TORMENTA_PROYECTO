import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatPen } from "../../../types/storefront";

type Props = {
  precio: number;
  disabled?: boolean;
  onAdd: () => void;
  inCart?: boolean;
  slug: string;
  whatsapp?: ReactNode;
  addLabel?: string;
};

export function StickyBuyBar({ precio, disabled, onAdd, inCart, slug, whatsapp, addLabel }: Props) {
  const label = addLabel || "Comprar ahora";
  return (
    <div className="store-sticky-bar lg:hidden px-4 py-3 flex items-center gap-3">
      <div className="shrink-0">
        <p className="text-xs store-muted">Total</p>
        <p className="font-semibold" style={{ color: "var(--vitrina-accent)" }}>
          {formatPen(precio)}
        </p>
      </div>
      {whatsapp ? (
        <div className="flex-1 min-w-0">{whatsapp}</div>
      ) : inCart && !addLabel ? (
        <Link
          to={`/tienda/${slug}/carrito`}
          className="vitrina-pill h-11 px-5 inline-flex items-center justify-center text-sm font-semibold text-white"
          style={{ background: "var(--vitrina-accent)" }}
        >
          Ir al carrito
        </Link>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={onAdd}
          className="vitrina-pill flex-1 h-11 px-5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: "var(--vitrina-accent)" }}
        >
          {label}
        </button>
      )}
    </div>
  );
}

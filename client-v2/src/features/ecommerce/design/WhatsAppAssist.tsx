import { MessageCircle } from "lucide-react";
import { buildWaMessage, waLink } from "./buildWaMessage";
import type { EcomCartItem } from "../store/useEcommerceCartStore";
import type { StoreProducto, StoreSucursal } from "../types/storefront";

type Props = {
  telefono?: string | null;
  tiendaNombre?: string;
  branch?: StoreSucursal | null;
  product?: StoreProducto | null;
  cart?: EcomCartItem[];
  qty?: number;
  className?: string;
  label?: string;
};

export function WhatsAppAssist({
  telefono,
  tiendaNombre,
  branch,
  product,
  cart,
  qty,
  className = "",
  label = "WhatsApp",
}: Props) {
  const phone = branch?.whatsapp || branch?.telefono || telefono;
  const href = waLink(
    phone,
    buildWaMessage({ tiendaNombre, branch, product, cart, qty })
  );
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`store-nav-btn inline-flex items-center gap-1.5 text-sm min-h-11 px-2 ${className}`}
      style={{ color: "var(--vitrina-accent)" }}
    >
      <MessageCircle className="size-4" />
      {label}
    </a>
  );
}

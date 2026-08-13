import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { registrarConsultaDisponibilidad } from "../api/ecommerce";
import { buildDisponibilidadWaMessage, waLink } from "./buildWaMessage";
import type { AttrSnapshotItem, StoreProducto, StoreSucursal } from "../types/storefront";

type Props = {
  slug: string;
  telefono?: string | null;
  tiendaNombre?: string;
  branch?: StoreSucursal | null;
  product: StoreProducto;
  qty?: number;
  sku?: string | null;
  attrs?: AttrSnapshotItem[];
  id_variante?: number | null;
  productUrl?: string;
  origen?: string;
  className?: string;
  label?: string;
  primary?: boolean;
  mensajeIntro?: string | null;
};

export function ConsultarWhatsAppButton({
  slug,
  telefono,
  tiendaNombre,
  branch,
  product,
  qty = 1,
  sku,
  attrs,
  id_variante,
  productUrl,
  origen = "producto",
  className = "",
  label = "Consultar disponibilidad por WhatsApp",
  primary = true,
  mensajeIntro,
}: Props) {
  const phone = branch?.whatsapp || branch?.telefono || telefono;
  const href = waLink(
    phone,
    buildDisponibilidadWaMessage({
      tiendaNombre,
      product,
      branch,
      qty,
      sku: sku || product.sku,
      attrs,
      productUrl,
      intro: mensajeIntro,
    })
  );

  const onClick = () => {
    void registrarConsultaDisponibilidad(slug, {
      id_producto: product.id_producto,
      id_variante: id_variante || undefined,
      id_sucursal: branch?.id_sucursal,
      cantidad: qty,
      attrs_snapshot: attrs?.map((a) => ({ nombre: a.nombre, valor: a.valor })),
      origen,
    }).catch(() => {
      /* analítica opcional */
    });
  };

  if (!phone || !href) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center gap-2 min-h-12 px-5 text-sm font-semibold rounded-[var(--store-radius-pill)] opacity-50 ${className}`}
        onClick={() => toast.error("Esta sucursal aún no tiene WhatsApp configurado")}
      >
        <MessageCircle className="size-4" />
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className={
        primary
          ? `vitrina-pill inline-flex items-center justify-center gap-2 min-h-12 px-6 text-sm font-semibold text-white ${className}`
          : `store-nav-btn inline-flex items-center justify-center gap-2 min-h-11 px-4 text-sm font-medium ${className}`
      }
      style={primary ? { background: "#25D366" } : { color: "var(--vitrina-accent)" }}
    >
      <MessageCircle className="size-4" />
      {label}
    </a>
  );
}

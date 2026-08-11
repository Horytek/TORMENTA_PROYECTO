import type { EcomCartItem } from "../store/useEcommerceCartStore";
import type { StoreProducto, StoreSucursal } from "../types/storefront";

export function buildWaMessage(opts: {
  tiendaNombre?: string;
  product?: StoreProducto | null;
  branch?: StoreSucursal | null;
  cart?: EcomCartItem[];
  qty?: number;
}) {
  const lines: string[] = [];
  lines.push(`Hola, escribo desde ${opts.tiendaNombre || "la tienda online"}.`);
  if (opts.branch) {
    lines.push(`Sucursal de recojo: ${opts.branch.nombre}`);
    lines.push(`Dirección: ${opts.branch.direccion}`);
  }
  if (opts.product) {
    lines.push("");
    lines.push(`Producto: ${opts.product.nombre}`);
    lines.push(`Precio: S/ ${Number(opts.product.precio).toFixed(2)}`);
    if (opts.qty && opts.qty > 1) lines.push(`Cantidad: ${opts.qty}`);
  }
  if (opts.cart?.length) {
    lines.push("");
    lines.push("Mi carrito:");
    for (const i of opts.cart) {
      lines.push(`• ${i.nombre} x${i.cantidad} — S/ ${(i.precio * i.cantidad).toFixed(2)}`);
    }
  }
  lines.push("");
  lines.push("¿Me ayudas con mi pedido?");
  return lines.join("\n");
}

export function waLink(telefono: string | null | undefined, message: string) {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, "");
  if (digits.length < 6) return null;
  const wa = digits.startsWith("51") ? digits : `51${digits}`;
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}

import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

export function CartFab({ slug, count }: { slug: string; count: number }) {
  if (count <= 0) return null;
  return (
    <Link
      to={`/tienda/${slug}/carrito`}
      className="store-fab inline-flex items-center gap-2 px-4 rounded-full text-white shadow-lg lg:hidden"
      style={{ background: "var(--vitrina-accent)" }}
      aria-label={`Carrito, ${count} ítems`}
    >
      <ShoppingBag className="size-4" />
      <span className="text-sm font-semibold">{count}</span>
    </Link>
  );
}

import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { buyerListFavoritos } from "../api/ecommerce";
import { ProductCover } from "../components/vitrina/ProductCover";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import type { StoreProducto } from "../types/storefront";
import { toast } from "sonner";

export default function StoreFavoritesPage() {
  const { slug = "" } = useParams();
  const add = useEcommerceCartStore((s) => s.add);

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-favs", slug],
    queryFn: () => buyerListFavoritos(slug),
  });
  const productos = (data?.data || []) as StoreProducto[];

  const handleAdd = (p: StoreProducto) => {
    add(
      {
        id_producto: p.id_producto,
        nombre: p.nombre,
        precio: Number(p.precio),
        imagen_url: p.imagen_url,
      },
      1
    );
    toast.success("Agregado al carrito");
  };

  if (isLoading) return <p className="store-muted">Cargando favoritos…</p>;

  if (!productos.length) {
    return (
      <div className="text-center py-12 store-muted">
        <p>No tienes favoritos aún.</p>
        <Link to={`/tienda/${slug}`} className="text-[var(--vitrina-accent)] font-medium mt-2 inline-block">
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {productos.map((p) => (
        <ProductCover
          key={p.id_producto}
          producto={p}
          slug={slug}
          onAdd={p.stock > 0 ? handleAdd : undefined}
          quickAdd={p.stock > 0}
        />
      ))}
    </div>
  );
}

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { buyerListFavoritos, getStore } from "../api/erpStore";
import { ProductCover } from "../components/vitrina/ProductCover";
import { QuickAddSheet, useQuickAddGuard } from "../components/vitrina/QuickAddSheet";
import { AvailabilityStatus } from "../design/AvailabilityStatus";
import { ConsultarWhatsAppButton } from "../design/ConsultarWhatsAppButton";
import { useBranchStore } from "../store/useBranchStore";
import type { StoreProducto, StoreTienda } from "../types/storefront";

export default function StoreFavoritesPage() {
  const { slug = "" } = useParams();
  const [pending, setPending] = useState<StoreProducto | null>(null);
  const canAdd = useQuickAddGuard();
  const activeBranch = useBranchStore((s) => s.activeBranch());

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-favs", slug],
    queryFn: () => buyerListFavoritos(slug),
  });
  const storeQ = useQuery({
    queryKey: ["store-meta", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });
  const productos = (data?.data || []) as StoreProducto[];
  const tienda = storeQ.data?.data?.tienda as StoreTienda | undefined;

  const handleAdd = (p: StoreProducto) => {
    if (p.disponibilidad && !p.disponibilidad.cta?.allowAddToCart) return;
    if (!canAdd(p)) return;
    setPending(p);
  };

  if (isLoading) return <p className="store-muted">Cargando favoritos…</p>;

  if (!productos.length) {
    return (
      <div className="text-center py-12 store-muted">
        <p>No tienes favoritos aún.</p>
        <Link to={`/s/${slug}`} className="text-[var(--vitrina-accent)] font-medium mt-2 inline-block">
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {productos.map((p) => (
          <div key={p.id_producto} className="space-y-2">
            <ProductCover producto={p} slug={slug} onAdd={handleAdd} />
            {p.disponibilidad && (
              <AvailabilityStatus disp={p.disponibilidad} showHint={p.disponibilidad.estado === "consultar"} />
            )}
            {p.disponibilidad?.cta?.showWhatsapp && tienda && (
              <ConsultarWhatsAppButton
                slug={slug}
                telefono={tienda.telefono}
                tiendaNombre={tienda.nombre}
                branch={activeBranch}
                product={p}
                origen="favoritos"
                primary={p.disponibilidad.cta.primary === "whatsapp"}
                label="Consultar disponibilidad"
                className="w-full"
                mensajeIntro={tienda.disponibilidad_config?.mensaje_intro}
              />
            )}
          </div>
        ))}
      </div>
      <QuickAddSheet slug={slug} producto={pending} onClose={() => setPending(null)} />
    </>
  );
}

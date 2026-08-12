import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOpinionesGenerales, getStore } from "../api/ecommerce";
import { useStorefrontAuthStore } from "../store/useStorefrontAuthStore";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StoreFooter } from "../components/vitrina/StoreFooter";
import { ReviewCard, type ReviewItem } from "../components/reviews/ReviewCard";
import { ReviewForm } from "../components/reviews/ReviewForm";
import { Button } from "@/components/ui/button";
import type { StoreTienda } from "../types/storefront";

export default function StoreOpinionesPage() {
  const { slug = "" } = useParams();
  const qc = useQueryClient();
  const hydrate = useStorefrontAuthStore((s) => s.hydrate);
  const token = useStorefrontAuthStore((s) => s.token);
  const setSlug = useEcommerceCartStore((s) => s.setSlug);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    if (slug) {
      hydrate(slug);
      setSlug(slug);
    }
  }, [slug, hydrate, setSlug]);

  const storeQ = useQuery({
    queryKey: ["store-meta", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });
  const opinionesQ = useQuery({
    queryKey: ["opiniones", slug],
    queryFn: () => getOpinionesGenerales(slug, 40),
    enabled: Boolean(slug),
  });

  const tienda = (storeQ.data?.data?.tienda || {
    slug,
    nombre: slug,
    color_primario: "#0E7C7B",
  }) as StoreTienda;
  const reviews = (opinionesQ.data?.data?.reviews || []) as ReviewItem[];

  return (
    <StoreShell tienda={tienda} slug={slug}>
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to={`/tienda/${slug}`} className="text-sm store-muted hover:underline">
              ← Tienda
            </Link>
            <h1 className="vitrina-display text-3xl mt-2">Opiniones</h1>
            <p className="text-sm store-muted mt-1">
              Comentarios generales sobre la tienda y el servicio.
            </p>
          </div>
          {token && !writing && (
            <Button type="button" size="sm" onClick={() => setWriting(true)}>
              Escribir opinión
            </Button>
          )}
          {!token && (
            <Link
              to={`/tienda/${slug}/login`}
              className="text-sm font-medium"
              style={{ color: "var(--vitrina-accent)" }}
            >
              Inicia sesión para opinar
            </Link>
          )}
        </div>

        {writing && (
          <div className="rounded-2xl border store-hairline bg-[var(--vitrina-elevated)] p-5">
            <ReviewForm
              slug={slug}
              tipo="general"
              onCancel={() => setWriting(false)}
              onSuccess={() => {
                setWriting(false);
                qc.invalidateQueries({ queryKey: ["opiniones", slug] });
                qc.invalidateQueries({ queryKey: ["mis-reviews", slug] });
              }}
            />
          </div>
        )}

        <div>
          {opinionesQ.isLoading && <p className="store-muted text-sm">Cargando…</p>}
          {!opinionesQ.isLoading && reviews.length === 0 && (
            <p className="store-muted text-sm py-8">Aún no hay opiniones publicadas.</p>
          )}
          {reviews.map((r) => (
            <ReviewCard key={r.id_review} review={r} />
          ))}
        </div>
      </main>
      <StoreFooter tienda={tienda} slug={slug} />
    </StoreShell>
  );
}

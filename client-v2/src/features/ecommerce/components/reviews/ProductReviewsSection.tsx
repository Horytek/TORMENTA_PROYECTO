import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProductReviews, getReviewEligibilidad } from "../../api/ecommerce";
import { useStorefrontAuthStore } from "../../store/useStorefrontAuthStore";
import { ReviewSummary, type ReviewSummaryData } from "./ReviewSummary";
import { ReviewCard, type ReviewItem } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { Button } from "@/components/ui/button";

const SORTS = [
  { value: "recientes", label: "Recientes" },
  { value: "mejor", label: "Mejor valoradas" },
  { value: "peor", label: "Peor valoradas" },
  { value: "fotos", label: "Con fotos" },
  { value: "verificadas", label: "Verificadas" },
];

type Props = {
  slug: string;
  id_producto: number;
};

export function ProductReviewsSection({ slug, id_producto }: Props) {
  const qc = useQueryClient();
  const hydrate = useStorefrontAuthStore((s) => s.hydrate);
  const token = useStorefrontAuthStore((s) => s.token);
  const isAuth = Boolean(token);

  const [sort, setSort] = useState("recientes");
  const [showAll, setShowAll] = useState(false);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    if (slug) hydrate(slug);
  }, [slug, hydrate]);

  const reviewsQ = useQuery({
    queryKey: ["product-reviews", slug, id_producto, sort, showAll],
    queryFn: () =>
      getProductReviews(slug, id_producto, {
        sort,
        page: 1,
        limit: showAll ? 40 : 3,
      }),
    enabled: Boolean(slug && id_producto),
  });

  const eligQ = useQuery({
    queryKey: ["review-elig", slug, "producto", id_producto],
    queryFn: () => getReviewEligibilidad(slug, { tipo: "producto", id_producto }),
    enabled: Boolean(slug && id_producto && isAuth),
  });

  const summary = (reviewsQ.data?.data?.summary || {
    total: 0,
    promedio: 0,
    histograma: {},
  }) as ReviewSummaryData;
  const reviews = (reviewsQ.data?.data?.reviews || []) as ReviewItem[];
  const puede = Boolean(eligQ.data?.data?.puede);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 border-t store-hairline">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide store-muted">Opiniones</p>
          <h2 className="vitrina-display text-2xl sm:text-3xl mt-1">Opiniones de clientes</h2>
        </div>
        {isAuth && puede && !writing && (
          <Button type="button" size="sm" onClick={() => setWriting(true)}>
            Escribir opinión
          </Button>
        )}
        {!isAuth && (
          <Link
            to={`/tienda/${slug}/login`}
            className="text-sm font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--vitrina-accent)" }}
          >
            Inicia sesión para opinar
          </Link>
        )}
        {isAuth && eligQ.data?.data && !eligQ.data.data.puede && (
          <p className="text-xs store-muted max-w-xs text-right">{eligQ.data.data.motivo}</p>
        )}
      </div>

      <ReviewSummary summary={summary} onVerTodas={() => setShowAll(true)} />

      {writing && (
        <div className="mt-6 rounded-2xl border store-hairline bg-[var(--vitrina-elevated)] p-4 sm:p-5">
          <ReviewForm
            slug={slug}
            tipo="producto"
            id_producto={id_producto}
            onCancel={() => setWriting(false)}
            onSuccess={() => {
              setWriting(false);
              qc.invalidateQueries({ queryKey: ["product-reviews", slug, id_producto] });
              qc.invalidateQueries({ queryKey: ["review-elig", slug, "producto", id_producto] });
            }}
          />
        </div>
      )}

      {(showAll || reviews.length > 0) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setSort(s.value);
                setShowAll(true);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border store-hairline ${
                sort === s.value ? "bg-[var(--vitrina-accent-soft)] font-medium" : "store-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        {reviewsQ.isLoading && <p className="text-sm store-muted py-4">Cargando opiniones…</p>}
        {!reviewsQ.isLoading && reviews.length === 0 && (
          <p className="text-sm store-muted py-6">Aún no hay opiniones publicadas.</p>
        )}
        {reviews.map((r) => (
          <ReviewCard key={r.id_review} review={r} />
        ))}
        {!showAll && summary.total > 3 && (
          <Button type="button" variant="outline" className="mt-4" onClick={() => setShowAll(true)}>
            Ver todas ({summary.total})
          </Button>
        )}
      </div>
    </section>
  );
}

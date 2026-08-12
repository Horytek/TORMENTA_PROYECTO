import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listMisReviews } from "../api/ecommerce";
import { ReviewCard, type ReviewItem } from "../components/reviews/ReviewCard";

export default function StoreMisReviewsPage() {
  const { slug = "" } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["mis-reviews", slug],
    queryFn: () => listMisReviews(slug),
    enabled: Boolean(slug),
  });

  const reviews = (data?.data || []) as ReviewItem[];

  if (isLoading) return <p className="store-muted">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Mis opiniones</h2>
        <p className="text-sm store-muted mt-1">
          Incluye pendientes de moderación y publicadas.
        </p>
      </div>
      {reviews.length === 0 && (
        <p className="text-sm store-muted py-8">Todavía no has dejado opiniones.</p>
      )}
      <div>
        {reviews.map((r) => (
          <ReviewCard key={r.id_review} review={r} showEstado />
        ))}
      </div>
    </div>
  );
}

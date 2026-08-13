import { BadgeCheck } from "lucide-react";
import { ReviewStars } from "./ReviewStars";
import { ReviewMediaThumbs } from "./ReviewMediaThumbs";

export type ReviewItem = {
  id_review: number;
  rating: number;
  titulo?: string | null;
  comentario?: string | null;
  tema_general?: string | null;
  compra_verificada?: boolean;
  nombre_publico?: string | null;
  created_at?: string;
  estado?: string;
  media?: { id_media?: number; url: string }[];
  reply?: { cuerpo: string; created_at?: string } | null;
  producto_nombre?: string | null;
};

type Props = {
  review: ReviewItem;
  showEstado?: boolean;
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  publicada: "Publicada",
  ocultada: "Oculta",
  rechazada: "Rechazada",
};

export function ReviewCard({ review, showEstado }: Props) {
  const initial = (review.nombre_publico || "C").charAt(0).toUpperCase();
  const fecha = review.created_at
    ? new Date(review.created_at).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <article className="border-b store-hairline py-4 last:border-0">
      <div className="flex gap-3">
        <div
          className="size-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 text-white"
          style={{ background: "var(--vitrina-accent)" }}
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium">{review.nombre_publico || "Cliente"}</span>
            {review.compra_verificada && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-700">
                <BadgeCheck className="size-3.5" /> Compra verificada
              </span>
            )}
            {fecha && <span className="text-xs store-muted">{fecha}</span>}
            {showEstado && review.estado && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 store-muted">
                {ESTADO_LABEL[review.estado] || review.estado}
              </span>
            )}
          </div>
          <ReviewStars value={review.rating} size="sm" />
          {review.titulo && <p className="text-sm font-medium">{review.titulo}</p>}
          {review.tema_general && (
            <p className="text-xs store-muted capitalize">Tema: {review.tema_general}</p>
          )}
          {review.comentario && (
            <p className="text-sm leading-relaxed store-muted whitespace-pre-line">{review.comentario}</p>
          )}
          {review.media && review.media.length > 0 && (
            <ReviewMediaThumbs urls={review.media.map((m) => m.url)} />
          )}
          {review.reply?.cuerpo && (
            <div className="mt-2 rounded-lg border store-hairline bg-[var(--vitrina-elevated)] p-3 text-sm">
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--vitrina-accent)" }}>
                Respuesta de la tienda
              </p>
              <p className="leading-relaxed">{review.reply.cuerpo}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

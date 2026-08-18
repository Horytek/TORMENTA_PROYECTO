import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AtelierChrome,
  AtelierButton,
  ArtistSignature,
  EmptyState,
  ATELIER_COPY,
  ATELIER_ROUTES,
} from "@/features/atelier";
import { listAtelierCreators } from "@/features/platform/api/atelier";
import { creatorName, formatFromPrice, type AtelierCreator } from "../types";

export default function ArtistsPage() {
  const [creators, setCreators] = useState<AtelierCreator[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    void listAtelierCreators()
      .then((res) => setCreators(res.data || []))
      .catch(() => {
        setCreators([]);
        setError(true);
      });
  }, []);

  return (
    <AtelierChrome>
      <main className="at-land-wrap pb-20 md:pb-28">
        <header className="at-discover-hero">
          <h1 className="at-display at-page-title">Artistas</h1>
          <p className="at-ui at-land-dek">Estudios publicados. Encarga directo a su trazo.</p>
        </header>
        {error ? (
          <EmptyState tone="error" />
        ) : creators.length ? (
          <ul className="at-artists-index">
            {creators.map((c) => (
              <li key={c.slug} className="at-artists-index-item">
                <Link to={ATELIER_ROUTES.artist(c.slug)} className="at-focus at-artist-index-link">
                  <ArtistSignature
                    name={creatorName(c)}
                    mark={c.estilos || undefined}
                    avatarSrc={c.avatar_url || undefined}
                    available={c.disponible == null ? undefined : Boolean(c.disponible)}
                  />
                  <span className="at-ui at-artist-index-price">
                    {formatFromPrice(c.precio_desde) ?? "A cotizar"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={ATELIER_COPY.emptyGallery}
            body="Cuando un artista publique su estudio, aparece aquí."
          />
        )}
      </main>
    </AtelierChrome>
  );
}

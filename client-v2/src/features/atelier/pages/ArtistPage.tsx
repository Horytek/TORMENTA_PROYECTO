import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AtelierChrome,
  AtelierButton,
  ArtistSignature,
  ArtworkCard,
  Masonry,
  MasonryItem,
  EmptyState,
  artworkAspect,
  ATELIER_COPY,
  ATELIER_ROUTES,
} from "@/features/atelier";
import {
  getAtelierCreator,
  listAtelierCreatorPublicPortfolio,
  listAtelierCreatorPublicServices,
} from "@/features/platform/api/atelier";
import {
  creatorName,
  formatFromPrice,
  type AtelierCreator,
  type AtelierPortfolioItem,
  type AtelierService,
} from "../types";

export default function ArtistPage() {
  const { slug = "" } = useParams();
  const [profile, setProfile] = useState<AtelierCreator | null>(null);
  const [portfolio, setPortfolio] = useState<AtelierPortfolioItem[]>([]);
  const [services, setServices] = useState<AtelierService[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setError(false);
    void Promise.all([
      getAtelierCreator(slug),
      listAtelierCreatorPublicPortfolio(slug),
      listAtelierCreatorPublicServices(slug),
    ])
      .then(([c, p, s]) => {
        setProfile(c.data || null);
        setPortfolio(p.data || []);
        setServices(s.data || []);
      })
      .catch(() => {
        setProfile(null);
        setPortfolio([]);
        setServices([]);
        setError(true);
      });
  }, [slug]);

  const name = profile ? creatorName(profile) : "Artista";
  const commissionHref = slug ? ATELIER_ROUTES.commissionFor(slug) : ATELIER_ROUTES.commission;

  return (
    <AtelierChrome
      trailing={
        <AtelierButton size="sm" asChild>
          <Link to={commissionHref}>{ATELIER_COPY.ctaCommission}</Link>
        </AtelierButton>
      }
    >
      <main className="at-land-wrap pb-20 md:pb-28">
        {error && !profile ? (
          <EmptyState
            tone="error"
            action={
              <AtelierButton variant="tertiary" asChild>
                <Link to={ATELIER_ROUTES.discover}>Volver a Descubrir</Link>
              </AtelierButton>
            }
          />
        ) : (
          <>
            <header className="at-artist-hero">
              <ArtistSignature
                name={name}
                mark={profile?.estilos || undefined}
                avatarSrc={profile?.avatar_url || undefined}
                available={profile?.disponible == null ? undefined : Boolean(profile.disponible)}
                size="md"
              />
              {profile?.bio ? <p className="at-ui at-artist-bio">{profile.bio}</p> : null}
              <p className="at-ui at-artist-meta">
                {profile && profile.disponible === false
                  ? "Actualmente no estoy aceptando nuevos encargos."
                  : formatFromPrice(profile?.precio_desde) ?? "Encargos a medida"}
              </p>
              <AtelierButton size="lg" asChild>
                <Link to={commissionHref}>{ATELIER_COPY.ctaCommission}</Link>
              </AtelierButton>
            </header>

            <section className="at-artist-gallery">
              <h2 className="at-display at-land-h2">Galería</h2>
              {portfolio.length ? (
                <Masonry>
                  {portfolio.map((item) => (
                    <MasonryItem key={item.id_item}>
                      <ArtworkCard
                        title={item.titulo || "Obra"}
                        imageSrc={item.image_url || undefined}
                        imageAlt={item.titulo || "Obra"}
                        aspect={artworkAspect(item.id_item)}
                      />
                    </MasonryItem>
                  ))}
                </Masonry>
              ) : (
                <EmptyState
                  title={ATELIER_COPY.emptyGallery}
                  body={ATELIER_COPY.emptyGalleryBody}
                  action={
                    <AtelierButton asChild>
                      <Link to={commissionHref}>{ATELIER_COPY.ctaCommission}</Link>
                    </AtelierButton>
                  }
                />
              )}
            </section>

            {services.length ? (
              <section className="at-artist-services">
                <h2 className="at-display at-land-h2">Encargos que toma</h2>
                <ul className="at-service-list">
                  {services.map((s) => (
                    <li key={s.id_service} className="at-service-row">
                      <div>
                        <h3 className="at-display at-service-name">{s.nombre}</h3>
                        {s.descripcion ? <p className="at-ui at-service-desc">{s.descripcion}</p> : null}
                      </div>
                      <p className="at-ui at-service-price">{formatFromPrice(s.precio_base) ?? "A cotizar"}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </AtelierChrome>
  );
}

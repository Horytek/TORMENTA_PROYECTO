import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AtelierChrome,
  AtelierButton,
  ArtworkCard,
  Masonry,
  MasonryItem,
  EmptyState,
  artworkAspect,
  ATELIER_COPY,
  ATELIER_ROUTES,
} from "@/features/atelier";
import { listAtelierCategories, listAtelierCreators } from "@/features/platform/api/atelier";
import {
  creatorName,
  formatFromPrice,
  type AtelierCategory,
  type AtelierCreator,
} from "../types";

export default function DiscoverPage() {
  const [creators, setCreators] = useState<AtelierCreator[]>([]);
  const [categories, setCategories] = useState<AtelierCategory[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    void listAtelierCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    setError(false);
    void listAtelierCreators(qs ? `?${qs}` : undefined)
      .then((res) => setCreators(res.data || []))
      .catch(() => {
        setCreators([]);
        setError(true);
      });
  }, [q, category]);

  return (
    <AtelierChrome>
      <main>
        <header className="at-land-wrap at-discover-hero">
          <h1 className="at-display at-page-title">Descubrir</h1>
          <p className="at-ui at-land-dek">Obras y artistas. Encarga a quien dibuje lo que imaginas.</p>
          <label className="at-search">
            <span className="sr-only">Buscar artistas</span>
            <input
              className="at-search-input at-ui at-focus"
              placeholder="Nombre o estilo"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <button type="button" className="at-filter-open at-focus" onClick={() => setSheet(true)}>
            Filtrar
          </button>
          <div className="at-filter-row">
            <button
              type="button"
              className={`at-filter at-focus ${!category ? "is-on" : ""}`}
              onClick={() => setCategory("")}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.slug || c.nombre}
                type="button"
                className={`at-filter at-focus ${category === c.slug ? "is-on" : ""}`}
                onClick={() => setCategory(c.slug || "")}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </header>

        <section className="at-land-wrap pb-20 md:pb-28">
          {error ? (
            <EmptyState tone="error" />
          ) : creators.length ? (
            <Masonry>
              {creators.map((c) => (
                <MasonryItem key={c.slug}>
                  <ArtworkCard
                    title={creatorName(c)}
                    href={ATELIER_ROUTES.artist(c.slug)}
                    imageSrc={c.avatar_url || undefined}
                    imageAlt={creatorName(c)}
                    aspect={artworkAspect(c.slug)}
                    artist={{
                      name: creatorName(c),
                      mark: formatFromPrice(c.precio_desde) ?? c.estilos ?? undefined,
                      available: c.disponible == null ? undefined : Boolean(c.disponible),
                    }}
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
                  <Link to={ATELIER_ROUTES.commission}>{ATELIER_COPY.ctaCommission}</Link>
                </AtelierButton>
              }
            />
          )}
        </section>
        {sheet ? (
          <div className="at-paper-sheet" role="dialog" aria-label="Filtrar">
            <button type="button" className="at-paper-sheet-scrim" aria-label="Cerrar" onClick={() => setSheet(false)} />
            <div className="at-paper-sheet-panel">
              <p className="at-eyebrow">Filtrar</p>
              <h2 className="at-display mt-2 text-3xl">Categoría</h2>
              <div className="mt-6 flex flex-col gap-1">
                <button
                  type="button"
                  className={`at-filter at-focus min-h-11 text-left ${!category ? "is-on" : ""}`}
                  onClick={() => {
                    setCategory("");
                    setSheet(false);
                  }}
                >
                  Todos
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug || c.nombre}
                    type="button"
                    className={`at-filter at-focus min-h-11 text-left ${category === c.slug ? "is-on" : ""}`}
                    onClick={() => {
                      setCategory(c.slug || "");
                      setSheet(false);
                    }}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AtelierChrome>
  );
}

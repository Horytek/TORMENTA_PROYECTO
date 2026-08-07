import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { formatPen, tiendaTheme, type StoreProducto, type StoreTienda } from "../../types/storefront";

type Props = {
  tienda: StoreTienda;
  slug: string;
  productos: StoreProducto[];
  ctaLabel?: string;
  autoplayMs?: number;
};

export function FeaturedStage({ tienda, slug, productos, ctaLabel, autoplayMs = 6000 }: Props) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const featured = productos.slice(0, 5);
  const current = featured[active] ?? featured[0];
  const theme = tiendaTheme(tienda);
  const headline = theme.hero_headline?.trim() || tienda.nombre;
  const tagline = theme.hero_tagline?.trim() || tienda.descripcion || "";
  const isClara = theme.preset === "clara";
  const textMain = isClara ? "text-[var(--vitrina-ink)]" : "text-white";
  const textMuted = isClara ? "text-slate-600" : "text-white/70";
  const textSoft = isClara ? "text-slate-400" : "text-white/55";

  useEffect(() => {
    if (reduce || featured.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % featured.length);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [featured.length, reduce, autoplayMs]);

  const scrollCatalogo = () => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  if (featured.length === 0) {
    return (
      <section className={`vitrina-stage-bg ${textMain} min-h-[70vh] flex items-center relative overflow-hidden`}>
        {theme.banner_url && (
          <img src={theme.banner_url} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        )}
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-20">
          <p className={`text-[11px] uppercase tracking-[0.25em] ${textSoft} mb-4`}>Vitrina</p>
          <h1 className="vitrina-display text-5xl sm:text-7xl max-w-3xl">{headline}</h1>
          {tagline && <p className={`mt-6 text-lg ${textMuted} max-w-xl`}>{tagline}</p>}
          <button
            type="button"
            onClick={scrollCatalogo}
            className="vitrina-pill store-focus-ring mt-10 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white"
            style={{ background: "var(--vitrina-accent)" }}
          >
            {ctaLabel || "Explorar catálogo"} <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`vitrina-stage-bg ${textMain} relative overflow-hidden`}>
      {theme.banner_url && (
        <img
          src={theme.banner_url}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-25 pointer-events-none"
        />
      )}
      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 min-h-[min(92vh,820px)] grid lg:grid-cols-[1.65fr_1fr] gap-6 lg:gap-10 py-10 lg:py-14 items-stretch">
        <div className="relative min-h-[320px] lg:min-h-0 store-stage-frame">
          <AnimatePresence mode="wait">
            <motion.div
              key={current?.id_producto}
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {current?.imagen_url ? (
                <img src={current.imagen_url} alt={current.nombre} className="size-full object-cover" />
              ) : (
                <div className="size-full bg-slate-800 flex items-center justify-center text-white/30">Sin imagen</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--vitrina-ink)] via-[var(--vitrina-ink)]/35 to-transparent opacity-80" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 flex flex-col justify-end h-full min-h-[320px] p-6 sm:p-10 text-white">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/55 mb-3">Vitrina · Escena</p>
              <h1 className="vitrina-display text-4xl sm:text-6xl lg:text-7xl max-w-2xl">{headline}</h1>
              {tagline && (
                <p className="mt-4 text-base sm:text-lg text-white/70 max-w-lg leading-relaxed line-clamp-2">
                  {tagline}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={scrollCatalogo}
                  className="vitrina-pill store-focus-ring inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white"
                  style={{ background: "var(--vitrina-accent)" }}
                >
                  {ctaLabel || "Explorar catálogo"}
                  <ArrowRight className="size-4" />
                </button>
                {current && (
                  <Link
                    to={`/tienda/${slug}/producto/${current.id_producto}`}
                    className="vitrina-pill store-focus-ring inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition"
                  >
                    Ver {current.nombre}
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-1.5 py-2">
          <p className={`text-[11px] uppercase tracking-[0.22em] ${textSoft} mb-3 px-1`}>Destacados</p>
          {featured.map((p, i) => {
            const isActive = i === active;
            return (
              <button
                key={p.id_producto}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`store-stage-item store-focus-ring flex items-center gap-3 p-3 text-left ${
                  isActive
                    ? `is-active ${isClara ? "bg-black/5" : "bg-white/10"}`
                    : "opacity-70 hover:opacity-100 hover:bg-black/5"
                }`}
              >
                <div className="store-thumb size-14 sm:size-16 shrink-0 bg-black/5">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-slate-700" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate text-sm sm:text-base">{p.nombre}</p>
                  <p
                    className="text-sm mt-0.5 font-medium"
                    style={{ color: isActive ? "var(--vitrina-accent)" : undefined }}
                  >
                    {formatPen(Number(p.precio))}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

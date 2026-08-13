import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
  const textSoft = isClara ? "text-slate-400" : "text-white/50";

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
      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 min-h-0 lg:min-h-[min(92vh,820px)] grid lg:grid-cols-[1.55fr_1fr] gap-6 lg:gap-12 py-6 sm:py-10 lg:py-14 items-stretch">
        {/* Hero visual — altura contenida en móvil */}
        <div className="relative min-h-[240px] sm:min-h-[300px] lg:min-h-0 aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto store-stage-frame max-h-[52vh] lg:max-h-none">
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
                <div
                  className="size-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(145deg, color-mix(in srgb, var(--vitrina-accent) 35%, #1a1a1a), #0f0f0f)",
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--vitrina-ink)] via-[var(--vitrina-ink)]/40 to-transparent opacity-85" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 flex flex-col justify-end h-full p-5 sm:p-8 lg:p-10 text-white">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/55 mb-2 sm:mb-3">
                En escena
              </p>
              <h1 className="vitrina-display text-[1.85rem] leading-[1.15] sm:text-5xl lg:text-7xl max-w-2xl">
                {headline}
              </h1>
              {tagline && (
                <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-white/70 max-w-lg leading-relaxed line-clamp-2">
                  {tagline}
                </p>
              )}
              <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={scrollCatalogo}
                  className="vitrina-pill store-focus-ring inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white w-full sm:w-auto"
                  style={{ background: "var(--vitrina-accent)" }}
                >
                  {ctaLabel || "Explorar catálogo"}
                  <ArrowRight className="size-4 shrink-0" />
                </button>
                {current && (
                  <Link
                    to={`/s/${slug}/producto/${current.id_producto}`}
                    className="vitrina-pill store-focus-ring inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition w-full sm:w-auto min-w-0"
                  >
                    <span className="truncate">Ver {current.nombre}</span>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Rail creativo: en móvil, lista compacta sin timeline ancha */}
        <div className="flex flex-col justify-center relative py-1 lg:py-2">
          <div className="flex items-end justify-between mb-3 sm:mb-5 px-0.5">
            <div>
              <p className={`text-[10px] uppercase tracking-[0.3em] ${textSoft}`}>Curaduría</p>
              <p className="text-base sm:text-lg font-semibold tracking-tight mt-0.5 sm:mt-1">En foco</p>
            </div>
            <div className="flex gap-1.5 items-center pb-1">
              {featured.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Producto ${i + 1}`}
                  onClick={() => setActive(i)}
                  className="h-1.5 rounded-full transition-all store-focus-ring"
                  style={{
                    width: i === active ? 22 : 8,
                    background:
                      i === active
                        ? "var(--vitrina-accent)"
                        : isClara
                          ? "rgba(0,0,0,0.15)"
                          : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Móvil: scroll horizontal de cards */}
          <div className="lg:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-none">
            <ul className="flex gap-3 pb-1 w-max">
              {featured.map((p, i) => {
                const isActive = i === active;
                return (
                  <li key={p.id_producto} className="snap-start w-[min(78vw,17rem)]">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className={`store-focus-ring w-full text-left rounded-2xl p-3 transition-all ${
                        isActive
                          ? isClara
                            ? "bg-white/80 shadow-sm ring-1 ring-black/5"
                            : "bg-white/10 ring-1 ring-white/15"
                          : isClara
                            ? "bg-white/40 ring-1 ring-black/5 opacity-70"
                            : "bg-white/5 ring-1 ring-white/10 opacity-70"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="size-14 rounded-xl overflow-hidden bg-black/10 shrink-0">
                          {p.imagen_url ? (
                            <img src={p.imagen_url} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="size-full bg-slate-700/80" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10px] tabular-nums ${textSoft}`}>
                            {String(i + 1).padStart(2, "0")}
                          </p>
                          <p className="font-semibold text-sm leading-snug line-clamp-2 mt-0.5">
                            {p.nombre}
                          </p>
                          <p
                            className="text-sm font-semibold mt-1"
                            style={{ color: "var(--vitrina-accent)" }}
                          >
                            {formatPen(Number(p.precio))}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop: timeline vertical */}
          <div className="hidden lg:block relative pl-5">
            <div
              className="absolute left-[7px] top-3 bottom-3 w-px"
              style={{ background: isClara ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)" }}
            />
            <motion.div
              className="absolute left-[5px] w-[5px] rounded-full"
              style={{ background: "var(--vitrina-accent)" }}
              animate={{
                top: `calc(${(active / Math.max(featured.length - 1, 1)) * 100}% * 0.72 + 12px)`,
              }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 28 }}
              aria-hidden
            >
              <span className="block size-[5px] rounded-full" />
            </motion.div>

            <ul className="space-y-2">
              {featured.map((p, i) => {
                const isActive = i === active;
                return (
                  <li key={p.id_producto}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      onMouseEnter={() => setActive(i)}
                      className={`store-focus-ring relative w-full text-left transition-all duration-300 ${
                        isActive ? "pl-1" : "pl-1 opacity-50 hover:opacity-80"
                      }`}
                    >
                      <span
                        className="absolute -left-5 top-1/2 -translate-y-1/2 size-2.5 rounded-full border-2"
                        style={{
                          borderColor: isActive
                            ? "var(--vitrina-accent)"
                            : isClara
                              ? "rgba(0,0,0,0.2)"
                              : "rgba(255,255,255,0.35)",
                          background: isActive ? "var(--vitrina-accent)" : "transparent",
                        }}
                      />

                      <AnimatePresence mode="wait">
                        {isActive ? (
                          <motion.div
                            key={`active-${p.id_producto}`}
                            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={reduce ? undefined : { opacity: 0, y: -6 }}
                            transition={{ duration: 0.28 }}
                            className={`flex gap-3 p-3 rounded-[1.1rem] backdrop-blur-md ${
                              isClara
                                ? "bg-white/70 shadow-sm ring-1 ring-black/5"
                                : "bg-white/10 ring-1 ring-white/15"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="size-[4.5rem] rounded-2xl overflow-hidden bg-black/10 rotate-[-3deg] shadow-md">
                                {p.imagen_url ? (
                                  <img src={p.imagen_url} alt="" className="size-full object-cover" />
                                ) : (
                                  <div className="size-full bg-slate-700" />
                                )}
                              </div>
                              <span
                                className="absolute -top-1.5 -left-1.5 size-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                                style={{ background: "var(--vitrina-accent)" }}
                              >
                                {String(i + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 py-0.5">
                              <p className="font-semibold text-[15px] leading-snug line-clamp-2">
                                {p.nombre}
                              </p>
                              <p
                                className="text-sm font-semibold mt-1.5"
                                style={{ color: "var(--vitrina-accent)" }}
                              >
                                {formatPen(Number(p.precio))}
                              </p>
                              <Link
                                to={`/s/${slug}/producto/${p.id_producto}`}
                                className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium opacity-80 hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Abrir ficha <ArrowUpRight className="size-3" />
                              </Link>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`idle-${p.id_producto}`}
                            initial={false}
                            className="flex items-center gap-3 py-2.5 px-2"
                          >
                            <span className={`text-[11px] tabular-nums w-5 ${textSoft}`}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm truncate">{p.nombre}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

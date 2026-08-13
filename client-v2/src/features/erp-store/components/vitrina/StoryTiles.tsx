import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { StoreProducto } from "../../types/storefront";

type Props = {
  slug: string;
  productos: StoreProducto[];
};

export function StoryTiles({ slug, productos }: Props) {
  const reduce = useReducedMotion();
  if (productos.length === 0) return null;

  return (
    <section>
      {productos.map((p, i) => {
        const dark = i % 2 === 1;
        return (
          <div
            key={p.id_producto}
            className={`relative overflow-hidden ${dark ? "vitrina-stage-bg text-white" : "bg-[var(--vitrina-fog)] text-[var(--vitrina-ink)]"}`}
          >
            <div
              className={`max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                i % 2 === 1 ? "" : ""
              }`}
            >
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55 }}
                className={i % 2 === 1 ? "lg:order-2" : ""}
              >
                <p
                  className={`text-[11px] uppercase tracking-[0.25em] mb-4 ${dark ? "text-white/45" : "text-slate-400"}`}
                >
                  Escena {i + 1}
                </p>
                <h2 className="vitrina-display text-4xl sm:text-5xl lg:text-6xl max-w-lg">{p.nombre}</h2>
                {p.descripcion && (
                  <p className={`mt-5 text-base sm:text-lg max-w-md leading-relaxed line-clamp-3 ${dark ? "text-white/65" : "text-slate-600"}`}>
                    {p.descripcion}
                  </p>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to={`/s/${slug}/producto/${p.id_producto}`}
                    className="vitrina-pill store-focus-ring inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white"
                    style={{ background: "var(--vitrina-accent)" }}
                  >
                    Comprar
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    to={`/s/${slug}/producto/${p.id_producto}`}
                    className={`vitrina-pill store-focus-ring inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold border transition ${
                      dark
                        ? "border-white/30 text-white hover:bg-white/10"
                        : "border-slate-300 text-[var(--vitrina-ink)] hover:bg-white"
                    }`}
                  >
                    Ver detalle
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className={`relative ${i % 2 === 1 ? "lg:order-1" : ""}`}
              >
                {p.imagen_url ? (
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full max-h-[420px] object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.28)] rounded-[var(--store-radius-lg)]"
                  />
                ) : (
                  <div className={`aspect-square max-h-[420px] rounded-[var(--store-radius-lg)] ${dark ? "bg-white/5" : "bg-white"}`} />
                )}
              </motion.div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

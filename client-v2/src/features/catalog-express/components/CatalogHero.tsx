import { ArrowRight, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { normalizarTelefono } from "../lib/whatsapp";
import type { CatalogoNegocio } from "../types";

type Props = {
  negocio: CatalogoNegocio;
  productosCount: number;
  categoriasCount: number;
  onVerCatalogo: () => void;
  hasWhatsApp: boolean;
  /** Imágenes destacadas del catálogo para el collage visual */
  previewImages?: string[];
};

export function CatalogHero({
  negocio,
  productosCount,
  categoriasCount,
  onVerCatalogo,
  hasWhatsApp,
  previewImages = [],
}: Props) {
  const reduce = useReducedMotion();
  const numero = normalizarTelefono(negocio.telefono);
  const waHref = hasWhatsApp && numero ? `https://wa.me/${numero}` : null;
  const imgs = previewImages.slice(0, 5);

  return (
    <section className="relative overflow-hidden border-b cx-hairline">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #0f1c1a 0%, #163530 50%, #1a2f2a 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 40%, rgba(37,211,102,0.28), transparent 42%), radial-gradient(circle at 85% 20%, rgba(18,140,126,0.35), transparent 38%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 text-white">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-w-0"
          >
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-white/55 mb-3">
              Pedidos por WhatsApp
            </p>
            <h1 className="cx-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.08]">
              {negocio.nombre}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/70 max-w-md leading-relaxed line-clamp-3">
              Explora el catálogo, arma tu pedido y envíalo al instante por WhatsApp.
              {negocio.direccion ? ` · ${negocio.direccion}` : ""}
            </p>

            <div className="mt-5 sm:mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onVerCatalogo}
                className="cx-focus inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full text-[var(--cx-cta-ink)]"
                style={{ background: "var(--cx-cta)" }}
              >
                Ver productos <ArrowRight className="size-4" />
              </button>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cx-focus inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full border border-white/25 text-white hover:bg-white/10"
                >
                  <MessageCircle className="size-4" /> Escribirnos
                </a>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-sm text-white/55">
              <span>
                <strong className="text-white font-semibold">{productosCount}</strong> productos
              </span>
              <span>
                <strong className="text-white font-semibold">{categoriasCount}</strong> categorías
              </span>
            </div>
          </motion.div>

          {/* Collage visual — desktop */}
          {imgs.length > 0 && (
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="hidden lg:grid grid-cols-3 grid-rows-2 gap-2.5 h-[min(340px,42vh)]"
              aria-hidden
            >
              <div className="row-span-2 col-span-2 relative rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10">
                <img src={imgs[0]} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
              {imgs[1] && (
                <div className="relative rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10">
                  <img src={imgs[1]} alt="" className="size-full object-cover" />
                </div>
              )}
              {imgs[2] && (
                <div className="relative rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10">
                  <img src={imgs[2]} alt="" className="size-full object-cover" />
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Strip horizontal — móvil / tablet */}
        {imgs.length > 0 && (
          <div className="lg:hidden mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
              {imgs.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={onVerCatalogo}
                  className="snap-start shrink-0 w-[42%] sm:w-[28%] aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-white/15 relative"
                >
                  <img src={src} alt="" className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

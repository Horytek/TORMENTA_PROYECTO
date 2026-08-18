import { ArrowRight, MessageCircle } from "lucide-react";
import { SALES_WHATSAPP_URL } from "../data/landing.data";

/**
 * Franja superior, sobre el header.
 *
 * No es sticky a propósito: el header sí lo es (`sticky top-0 z-40`), así que
 * esta se va con el scroll y no roba alto permanente en pantallas cortas.
 *
 * Lleva al WhatsApp de ventas porque hoy ese es el único canal de conversión
 * real del negocio. Cuando exista un programa de partners o una demo
 * autoservicio, este es el lugar para anunciarlo.
 */
export function TopBar() {
  return (
    <div className="bg-[hsl(var(--lp-ink))] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-x-3 gap-y-1 px-6 py-2.5 text-center">
        <MessageCircle
          className="hidden h-3.5 w-3.5 shrink-0 text-white/50 sm:block"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-[12.5px] leading-snug text-white/75">
          ¿Tienes una tienda de ropa y llevas el stock en cuaderno o Excel?
        </p>
        <a
          href={SALES_WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-white underline underline-offset-4 decoration-white/35 transition-colors hover:decoration-white"
        >
          Escríbenos
          <ArrowRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </a>
      </div>
    </div>
  );
}

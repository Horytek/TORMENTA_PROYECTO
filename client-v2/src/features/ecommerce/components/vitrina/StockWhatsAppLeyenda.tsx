import { MessageCircle } from "lucide-react";
import { DEFAULT_DISP_CONFIG } from "../../utils/disponibilidad";

const DEFAULT_LEYENDA = DEFAULT_DISP_CONFIG.mensaje_leyenda_stock;

/**
 * Leyenda fija: recomendar confirmar stock por WhatsApp ante eventualidades.
 * No bloquea compra ni crea reserva.
 */
export function StockWhatsAppLeyenda({
  mensaje,
  whatsappHref,
  className = "",
}: {
  mensaje?: string | null;
  whatsappHref?: string | null;
  className?: string;
}) {
  const text = (mensaje && mensaje.trim()) || DEFAULT_LEYENDA;
  return (
    <div
      className={`rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-3 text-xs text-amber-950 leading-relaxed ${className}`}
    >
      <p>{text}</p>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-2 font-semibold text-amber-900 underline underline-offset-2 min-h-11"
        >
          <MessageCircle className="size-3.5" />
          Consultar por WhatsApp
        </a>
      ) : null}
    </div>
  );
}

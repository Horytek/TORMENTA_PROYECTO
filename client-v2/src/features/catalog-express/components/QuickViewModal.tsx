import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Store } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { construirEnlaceWhatsApp, formatearMensajePedido } from "../lib/whatsapp";
import type { CatalogoProducto } from "../types";

interface QuickViewModalProps {
  producto: CatalogoProducto | null;
  nombreNegocio: string;
  telefono: string | null;
  onClose: () => void;
  onAdd?: (producto: CatalogoProducto) => void;
}

export function QuickViewModal({
  producto,
  nombreNegocio,
  telefono,
  onClose,
  onAdd,
}: QuickViewModalProps) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    setIndice(0);
  }, [producto?.codigo]);

  const imagenes =
    producto?.images && producto.images.length > 0
      ? producto.images
      : producto?.imagen_url
        ? [producto.imagen_url]
        : [];

  const enlaceWhatsApp = producto
    ? construirEnlaceWhatsApp(
        telefono,
        formatearMensajePedido([{ producto, cantidad: 1 }], nombreNegocio)
      )
    : null;

  return (
    <Dialog
      open={!!producto}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="cx max-w-[min(100vw-1.25rem,52rem)] w-full p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-[var(--cx-radius-lg)] border cx-hairline bg-[var(--cx-elevated)] max-h-[min(92dvh,900px)] flex flex-col">
        {producto && (
          <>
            <DialogTitle className="sr-only">{producto.descripcion}</DialogTitle>

            <div className="grid md:grid-cols-2 min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
              {/* Galería */}
              <div className="relative bg-black/[0.04] md:h-full md:min-h-[420px]">
                <div className="relative aspect-[3/4] md:aspect-auto md:absolute md:inset-0">
                  {imagenes.length > 0 ? (
                    <img
                      src={imagenes[indice]}
                      alt={producto.descripcion}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center opacity-30 min-h-[240px]">
                      <Store className="size-12" />
                    </div>
                  )}

                  {imagenes.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIndice((i) => (i === 0 ? imagenes.length - 1 : i - 1))}
                        className="cx-focus absolute left-2.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/95 shadow flex items-center justify-center"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setIndice((i) => (i === imagenes.length - 1 ? 0 : i + 1))
                        }
                        className="cx-focus absolute right-2.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/95 shadow flex items-center justify-center"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </>
                  )}
                </div>

                {imagenes.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-3 md:bottom-4">
                    <div className="flex gap-1.5 max-w-full overflow-x-auto px-1 py-1 rounded-full bg-black/35 backdrop-blur-sm">
                      {imagenes.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIndice(i)}
                          className={`shrink-0 size-10 sm:size-11 rounded-lg overflow-hidden ring-2 transition ${
                            i === indice ? "ring-white" : "ring-transparent opacity-70"
                          }`}
                          aria-label={`Imagen ${i + 1}`}
                        >
                          <img src={src} alt="" className="size-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Detalle */}
              <div className="flex flex-col p-5 sm:p-6 md:overflow-y-auto">
                <div className="flex-1 space-y-4">
                  <div>
                    {producto.nom_marca && (
                      <p className="text-[11px] font-semibold uppercase tracking-wider cx-muted mb-1">
                        {producto.nom_marca}
                      </p>
                    )}
                    <h2 className="cx-display text-xl sm:text-2xl font-bold leading-snug">
                      {producto.descripcion}
                    </h2>
                    {producto.categoria && (
                      <p className="text-xs cx-muted mt-1.5">{producto.categoria}</p>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3 pt-1">
                    <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--cx-accent)" }}>
                      S/ {producto.precio.toFixed(2)}
                    </p>
                    <p className="text-xs cx-muted pb-1">
                      {producto.stock} disponible{producto.stock === 1 ? "" : "s"}
                    </p>
                  </div>

                  {imagenes.length > 1 && (
                    <p className="text-[11px] cx-muted">
                      {indice + 1} / {imagenes.length} fotos
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-5 mt-auto sticky bottom-0 bg-[var(--cx-elevated)] pb-[env(safe-area-inset-bottom)]">
                  {onAdd && (
                    <button
                      type="button"
                      disabled={producto.stock === 0}
                      onClick={() => onAdd(producto)}
                      className="cx-focus h-11 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-full text-white disabled:opacity-45"
                      style={{ background: "var(--cx-accent)" }}
                    >
                      <Plus className="size-4" /> Agregar al pedido
                    </button>
                  )}
                  {enlaceWhatsApp ? (
                    <a
                      href={enlaceWhatsApp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cx-btn-wa cx-focus h-11 w-full inline-flex items-center justify-center gap-2 text-sm"
                    >
                      <MessageCircle className="size-4" /> Consultar por WhatsApp
                    </a>
                  ) : (
                    <p className="text-center text-xs text-red-600 py-2">
                      La tienda aún no configuró WhatsApp.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default QuickViewModal;

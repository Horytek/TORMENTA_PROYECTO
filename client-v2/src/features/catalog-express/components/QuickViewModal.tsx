import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Store } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { construirEnlaceWhatsApp, formatearMensajePedido } from "../lib/whatsapp";
import type { CatalogoProducto } from "../types";

// ─────────────────────────────────────────────────────────────────
// QuickViewModal — vista rápida del catálogo público: galería +
// descripción + precio + WhatsApp directo. Sin selector de variante
// (decisión de alcance: eso requeriría un endpoint público nuevo
// exponiendo stock por SKU).
// ─────────────────────────────────────────────────────────────────

interface QuickViewModalProps {
  producto: CatalogoProducto | null;
  nombreNegocio: string;
  telefono: string | null;
  onClose: () => void;
}

export function QuickViewModal({ producto, nombreNegocio, telefono, onClose }: QuickViewModalProps) {
  const [indice, setIndice] = useState(0);

  const imagenes = producto?.images && producto.images.length > 0
    ? producto.images
    : producto?.imagen_url
      ? [producto.imagen_url]
      : [];

  const enlaceWhatsApp = producto
    ? construirEnlaceWhatsApp(telefono, formatearMensajePedido([{ producto, cantidad: 1 }], nombreNegocio))
    : null;

  return (
    <Dialog
      open={!!producto}
      onOpenChange={(open) => {
        if (!open) {
          setIndice(0);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        {producto && (
          <>
            <DialogHeader>
              <DialogTitle className="line-clamp-2 text-base">{producto.descripcion}</DialogTitle>
            </DialogHeader>

            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              {imagenes.length > 0 ? (
                <img src={imagenes[indice]} alt={producto.descripcion} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/30">
                  <Store className="h-10 w-10" />
                </div>
              )}
              {imagenes.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIndice((i) => (i === 0 ? imagenes.length - 1 : i - 1))}
                    className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndice((i) => (i === imagenes.length - 1 ? 0 : i + 1))}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                    {imagenes.map((_, i) => (
                      <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === indice ? "bg-white" : "bg-white/50"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1">
              {producto.nom_marca && <p className="text-xs text-muted-foreground">{producto.nom_marca}</p>}
              <p className="text-xl font-bold text-brand">S/ {producto.precio.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{producto.stock} disponible{producto.stock === 1 ? "" : "s"}</p>
            </div>

            <DialogFooter>
              {enlaceWhatsApp ? (
                <Button asChild className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
                  </a>
                </Button>
              ) : (
                <p className="text-center text-xs text-destructive">Esta tienda no tiene WhatsApp configurado todavía.</p>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default QuickViewModal;

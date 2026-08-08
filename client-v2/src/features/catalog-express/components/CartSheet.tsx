import { MessageCircle, Minus, Plus, ShoppingCart, Store, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CarritoItem } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrito: CarritoItem[];
  total: number;
  enlaceWhatsApp: string | null;
  onCambiarCantidad: (codigo: number, delta: number) => void;
  onQuitar: (codigo: number) => void;
};

export function CartSheet({
  open,
  onOpenChange,
  carrito,
  total,
  enlaceWhatsApp,
  onCambiarCantidad,
  onQuitar,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="cx w-full sm:max-w-md flex flex-col p-0 gap-0 bg-[var(--cx-elevated)]"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b cx-hairline text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-5 text-[var(--cx-accent)]" />
            Tu pedido
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {carrito.length === 0 ? (
            <p className="py-12 text-center text-sm cx-muted">Tu pedido está vacío.</p>
          ) : (
            <ul className="space-y-2.5">
              {carrito.map((it) => (
                <li
                  key={it.producto.codigo}
                  className="flex items-center gap-3 rounded-[var(--cx-radius-sm)] border cx-hairline p-2.5"
                >
                  <div className="size-12 shrink-0 rounded-lg overflow-hidden bg-black/[0.04]">
                    {it.producto.images?.[0] || it.producto.imagen_url ? (
                      <img
                        src={it.producto.images?.[0] ?? it.producto.imagen_url ?? ""}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Store className="size-5 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{it.producto.descripcion}</p>
                    <p className="text-[11px] font-bold text-[var(--cx-accent)]">
                      S/ {it.producto.precio.toFixed(2)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="cx-focus size-7 rounded-full border cx-hairline flex items-center justify-center"
                      onClick={() => onCambiarCantidad(it.producto.codigo, -1)}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{it.cantidad}</span>
                    <button
                      type="button"
                      className="cx-focus size-7 rounded-full border cx-hairline flex items-center justify-center disabled:opacity-40"
                      onClick={() => onCambiarCantidad(it.producto.codigo, 1)}
                      disabled={it.cantidad >= it.producto.stock}
                    >
                      <Plus className="size-3" />
                    </button>
                    <button
                      type="button"
                      className="cx-focus size-7 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50"
                      onClick={() => onQuitar(it.producto.codigo)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t cx-hairline px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>Total estimado</span>
            <span className="text-lg text-[var(--cx-accent)]">S/ {total.toFixed(2)}</span>
          </div>

          {enlaceWhatsApp ? (
            <a
              href={enlaceWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className={`cx-btn-wa cx-focus w-full h-12 inline-flex items-center justify-center gap-2 text-sm ${
                carrito.length === 0 ? "pointer-events-none opacity-50" : ""
              }`}
              aria-disabled={carrito.length === 0}
              onClick={(e) => {
                if (carrito.length === 0) e.preventDefault();
              }}
            >
              <MessageCircle className="size-5" /> Enviar pedido por WhatsApp
            </a>
          ) : (
            <p className="text-center text-xs text-red-600">
              La tienda aún no configuró WhatsApp.
            </p>
          )}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cx-focus w-full text-xs cx-muted hover:text-[var(--cx-ink)] py-2"
          >
            Seguir viendo el catálogo
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

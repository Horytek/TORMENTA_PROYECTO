import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { useCartStore } from "@/store/useCartStore";
import { clienteNombre } from "@/features/sales/types";

// ─────────────────────────────────────────────────────────────────
// CartPanel — Panel lateral del carrito en el POS
// ─────────────────────────────────────────────────────────────────

interface CartPanelProps {
  onCheckout: () => void;
  disabled?: boolean;
}

export function CartPanel({ onCheckout, disabled }: CartPanelProps) {
  const items = useCartStore((s) => s.items);
  const cliente = useCartStore((s) => s.cliente);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getIgv = useCartStore((s) => s.getIgv);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const clearCart = useCartStore((s) => s.clearCart);

  const subtotal = getSubtotal();
  const igv = getIgv();
  const total = getTotal();
  const itemCount = getItemCount();

  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold text-foreground">Carrito</span>
            {!isEmpty && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                {itemCount}
              </span>
            )}
          </div>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
              onClick={clearCart}
            >
              <Trash2 className="h-3 w-3" />
              Vaciar
            </Button>
          )}
        </div>

        {/* Cliente seleccionado */}
        {cliente && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Cliente:</span>
            <span className="text-xs font-medium text-foreground truncate">
              {clienteNombre(cliente)}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-hidden">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/20 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground/60">Carrito vacío</p>
            <p className="text-xs text-muted-foreground/40 mt-0.5">Agrega productos del catálogo</p>
          </div>
        ) : (
          <ScrollShadow className="h-full">
            <div className="p-2 space-y-1.5">
              {items.map((item) => (
                <CartItemRow
                  key={item.id_producto}
                  item={item}
                  onQuantityChange={(qty) => updateQuantity(item.id_producto, qty)}
                  onRemove={() => removeItem(item.id_producto)}
                />
              ))}
            </div>
          </ScrollShadow>
        )}
      </div>

      {/* Totales + Botón */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>IGV (18%)</span>
            <span>S/ {igv.toFixed(2)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between text-sm font-bold text-foreground">
            <span>Total</span>
            <span className="text-primary">S/ {total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          disabled={isEmpty || disabled}
          onClick={onCheckout}
        >
          <span className="text-base font-bold">💰</span>
          Cobrar S/ {total.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CartItemRow — Fila individual de item en el carrito
// ─────────────────────────────────────────────────────────────────
interface CartItemRowProps {
  item: {
    id_producto: number;
    descripcion: string;
    nom_marca?: string;
    cantidad: number;
    precio_unitario: number;
    precio_total: number;
  };
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}

function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-zinc-50/40 dark:bg-zinc-900/40 p-2 group">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-tight line-clamp-1">
          {item.descripcion}
        </p>
        {item.nom_marca && (
          <p className="text-[10px] text-muted-foreground">{item.nom_marca}</p>
        )}
        <p className="text-[11px] font-medium text-primary mt-0.5">
          S/ {item.precio_total.toFixed(2)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {/* Cantidad */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onQuantityChange(item.cantidad - 1)}
            className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-card hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <span className="w-6 text-center text-xs font-semibold tabular-nums leading-none">
            {item.cantidad}
          </span>
          <button
            onClick={() => onQuantityChange(item.cantidad + 1)}
            className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-card hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Unit price */}
        <span className="text-[10px] text-muted-foreground">
          S/ {item.precio_unitario.toFixed(2)} c/u
        </span>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

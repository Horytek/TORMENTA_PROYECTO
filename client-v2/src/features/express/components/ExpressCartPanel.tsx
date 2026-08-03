import { Minus, Plus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useExpressCartStore } from "../store/useExpressCartStore";

interface ExpressCartPanelProps {
  onCheckout: () => void;
  isCheckingOut: boolean;
}

export function ExpressCartPanel({ onCheckout, isCheckingOut }: ExpressCartPanelProps) {
  const items = useExpressCartStore((s) => s.items);
  const updateQty = useExpressCartStore((s) => s.updateQty);
  const removeItem = useExpressCartStore((s) => s.removeItem);
  const clear = useExpressCartStore((s) => s.clear);
  const getTotal = useExpressCartStore((s) => s.getTotal);
  const total = getTotal();
  const isEmpty = items.length === 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">Carrito</span>
        </div>
        {!isEmpty && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={clear}>
            <Trash2 className="h-3 w-3" /> Vaciar
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-muted-foreground">
            <ShoppingCart className="h-8 w-8 opacity-30" />
            <p className="text-sm">Carrito vacío</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">S/ {item.price.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => updateQty(item.product_id, item.quantity - 1)}
                    className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-card"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product_id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-card disabled:opacity-40"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.product_id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border p-3">
        <Separator className="hidden" />
        <div className="flex items-center justify-between text-sm font-bold text-foreground">
          <span>Total</span>
          <span className="text-amber-500">S/ {total.toFixed(2)}</span>
        </div>
        <Button className="w-full gap-2 bg-amber-500 text-black hover:bg-amber-600" size="lg" disabled={isEmpty || isCheckingOut} onClick={onCheckout}>
          {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : "💰"} Cobrar S/ {total.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}

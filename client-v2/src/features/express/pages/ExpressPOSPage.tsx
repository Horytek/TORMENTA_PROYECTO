import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getExpressProducts, createExpressSale } from "../api/express";
import { ExpressProductGrid } from "../components/ExpressProductGrid";
import { ExpressCartPanel } from "../components/ExpressCartPanel";
import { useExpressCartStore } from "../store/useExpressCartStore";

export default function ExpressPOSPage() {
  const queryClient = useQueryClient();
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  const items = useExpressCartStore((s) => s.items);
  const addItem = useExpressCartStore((s) => s.addItem);
  const clear = useExpressCartStore((s) => s.clear);
  const getCount = useExpressCartStore((s) => s.getCount);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["express-products"],
    queryFn: getExpressProducts,
  });

  const cartQtyById = useMemo(() => new Map(items.map((i) => [i.product_id, i.quantity])), [items]);

  const checkout = useMutation({
    mutationFn: () =>
      createExpressSale({
        cart: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
        payment_method: "Efectivo",
      }),
    onSuccess: () => {
      toast.success("Venta registrada");
      clear();
      setCartSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ["express-products"] });
      queryClient.invalidateQueries({ queryKey: ["express-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "No se pudo registrar la venta");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:h-[calc(100vh-9rem)]">
      <div className="flex-1 lg:overflow-y-auto">
        <ExpressProductGrid products={products} cartQtyById={cartQtyById} onAdd={addItem} />
      </div>

      {/* Carrito: columna fija en desktop */}
      <div className="hidden lg:block lg:w-[360px]">
        <ExpressCartPanel onCheckout={() => checkout.mutate()} isCheckingOut={checkout.isPending} />
      </div>

      {/* Botón flotante + bottom sheet en mobile */}
      {items.length > 0 && (
        <Button
          onClick={() => setCartSheetOpen(true)}
          className="fixed bottom-24 left-1/2 z-20 -translate-x-1/2 gap-2 bg-amber-500 text-black shadow-lg hover:bg-amber-600 lg:hidden"
        >
          <ShoppingCart className="h-4 w-4" /> Ver carrito ({getCount()})
        </Button>
      )}

      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] lg:hidden">
          <SheetHeader>
            <SheetTitle>Carrito</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden px-4 pb-4">
            <ExpressCartPanel onCheckout={() => checkout.mutate()} isCheckingOut={checkout.isPending} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

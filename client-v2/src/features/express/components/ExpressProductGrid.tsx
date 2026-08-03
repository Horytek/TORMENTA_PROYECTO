import { useMemo, useState } from "react";
import { Search, Package, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ExpressProduct } from "../types";

interface ExpressProductGridProps {
  products: ExpressProduct[];
  cartQtyById: Map<number, number>;
  onAdd: (product: ExpressProduct) => void;
}

export function ExpressProductGrid({ products, cartQtyById, onAdd }: ExpressProductGridProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
          <Package className="h-8 w-8 opacity-40" />
          <p className="text-sm">{search ? `Sin resultados para "${search}"` : "Sin productos registrados."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filtered.map((p) => {
            const inCart = cartQtyById.get(p.id) ?? 0;
            const outOfStock = p.stock <= 0;
            return (
              <button
                key={p.id}
                onClick={() => onAdd(p)}
                disabled={outOfStock}
                className={`relative flex flex-col rounded-xl border p-3 text-left transition-colors ${
                  outOfStock
                    ? "cursor-not-allowed border-border/40 bg-muted/30 opacity-50"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {inCart > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">
                    {inCart}
                  </span>
                )}
                <span className="text-xs font-medium text-foreground line-clamp-2">{p.name}</span>
                <span className="mt-1.5 text-sm font-bold text-amber-500">S/ {Number(p.price).toFixed(2)}</span>
                <span className={`mt-0.5 text-[10px] ${outOfStock ? "text-destructive" : "text-muted-foreground"}`}>
                  Stock: {p.stock}
                </span>
                {!outOfStock && <Plus className="absolute bottom-2 right-2 h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCartStore } from "@/store/useCartStore";
import type { POSProduct, CartItem } from "@/features/sales/types";
import { getProductosVentas } from "@/features/sales/api/ventas";

// ─────────────────────────────────────────────────────────────────
// ProductCatalog — Grid de productos para el POS
// ─────────────────────────────────────────────────────────────────

interface ProductCatalogProps {
  selectedAlmacenId?: number;
}

export function ProductCatalog({ selectedAlmacenId }: ProductCatalogProps) {
  const [search, setSearch] = useState("");
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const { data: products = [], isLoading } = useQuery<POSProduct[]>({
    queryKey: ["productos-ventas", selectedAlmacenId],
    queryFn: () => getProductosVentas(selectedAlmacenId ? { id_almacen: selectedAlmacenId } : undefined),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo_barras?.toLowerCase().includes(q) ||
        String(p.codigo).includes(q) ||
        p.nom_marca?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleAddToCart = (product: POSProduct) => {
    if (product.stock !== undefined && product.stock <= 0) return;

    const cartItem: CartItem = {
      id_producto: product.codigo,
      codigo_barra: product.codigo_barras,
      descripcion: product.nombre,
      nom_marca: product.nom_marca,
      categoria_p: product.categoria_p,
      cantidad: 1,
      precio_unitario: Number(product.precio),
      precio_total: Number(product.precio),
      stock: product.stock,
    };
    addItem(cartItem);
  };

  const getCartQty = (productoId: number) => {
    const item = cartItems.find((i) => i.id_producto === productoId);
    return item?.cantidad ?? 0;
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header con búsqueda */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o barras…"
            className="h-9 pl-8 pr-3 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
          </span>
          {isLoading && <Spinner size="xs" />}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Package className="h-8 w-8 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              {search ? `No hay productos para "${search}"` : "No hay productos disponibles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {filtered.map((product) => {
              const inCart = getCartQty(product.codigo);
              const outOfStock = product.stock !== undefined && product.stock <= 0;
              return (
                <button
                  key={product.codigo}
                  onClick={() => handleAddToCart(product)}
                  disabled={outOfStock}
                  className={[
                    "relative flex flex-col rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer group",
                    outOfStock
                      ? "opacity-50 cursor-not-allowed bg-muted/30"
                      : "hover:border-primary/40 hover:shadow-sm hover:-translate-y-px bg-card border-border hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50",
                  ].join(" ")}
                >
                  {inCart > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {inCart}
                    </span>
                  )}
                  <span className="text-xs font-medium text-foreground leading-tight line-clamp-2 mb-1">
                    {product.nombre}
                  </span>
                  {(product.nom_marca || product.categoria_p) && (
                    <span className="text-[10px] text-muted-foreground truncate mb-1">
                      {[product.nom_marca, product.categoria_p].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <span className="text-sm font-bold text-primary mt-auto">
                    S/ {Number(product.precio).toFixed(2)}
                  </span>
                  {product.stock !== undefined && (
                    <span className={[
                      "text-[10px] mt-0.5",
                      outOfStock ? "text-destructive" : "text-muted-foreground",
                    ].join(" ")}>
                      Stock: {product.stock}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

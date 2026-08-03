import { useState, useMemo, type KeyboardEvent } from "react";
import { Package, WifiOff } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { VariantPicker, type VariantResolved } from "@/components/shared/VariantPicker";
import { useCartStore } from "@/store/useCartStore";
import type { POSProduct, CartItem } from "@/features/sales/types";
import { useCatalogoPOS } from "@/features/sales/hooks/useCatalogoPOS";
import { buscarSkuPorBarcode } from "@/features/products/api/products";

/** "hace 5 min" / "hace 2 h" — cuán vieja es la foto con la que se está vendiendo. */
const antiguedad = (desde: number): string => {
  const min = Math.floor((Date.now() - desde) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
};

const SIN_VARIANTE: VariantResolved = { id_sku: null, label: null, stock: null, ready: true };
// Estado inicial al abrir el diálogo de variantes: a diferencia de SIN_VARIANTE
// (que es el resultado real para un producto sin variantes), acá todavía no
// se eligió nada — debe bloquear "Agregar" hasta que VariantPicker resuelva.
const VARIANTE_SIN_ELEGIR: VariantResolved = { id_sku: null, label: null, stock: null, ready: false };

// ─────────────────────────────────────────────────────────────────
// ProductCatalog — Grid de productos para el POS
// ─────────────────────────────────────────────────────────────────

interface ProductCatalogProps {
  selectedAlmacenId?: number;
}

export function ProductCatalog({ selectedAlmacenId }: ProductCatalogProps) {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const [variantDialogProduct, setVariantDialogProduct] = useState<POSProduct | null>(null);
  const [pendingVariant, setPendingVariant] = useState<VariantResolved>(SIN_VARIANTE);

  // Sin conexión cae a la última foto guardada, ya descontada de lo vendido
  // offline. El service worker no cachea `/api/`, así que sin esto el POS
  // abriría con la lista vacía y no se podría armar ni un carrito.
  const { productos: products, isLoading, esFoto, fotoDe, sinDatos } = useCatalogoPOS(selectedAlmacenId);

  const categorias = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoria_p).filter((c): c is string => Boolean(c)))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (categoria) list = list.filter((p) => p.categoria_p === categoria);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo_barras?.toLowerCase().includes(q) ||
        String(p.codigo).includes(q) ||
        p.nom_marca?.toLowerCase().includes(q)
    );
  }, [products, search, categoria]);

  const handleAddToCart = (product: POSProduct, variante: VariantResolved = SIN_VARIANTE) => {
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
      stock: variante.stock ?? product.stock,
      id_sku: variante.id_sku,
      sku_label: variante.label,
      atributos_fijados: variante.atributosFijados,
      tipo_afectacion_igv: product.tipo_afectacion_igv,
    };
    addItem(cartItem);
  };

  // Un lector de código de barras "escribe" el código y manda Enter — no hay
  // que distinguir escaneo de tipeo manual, solo reaccionar a Enter. Si el
  // texto resuelve a una variante exacta (SKU), se agrega directo al carrito
  // sin pasar por el selector manual de talla/color.
  const handleScanEnter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !search.trim()) return;
    const codigo = search.trim();
    const match = await buscarSkuPorBarcode(codigo, selectedAlmacenId);
    if (!match) return;
    if (match.stock <= 0) return;
    addItem({
      id_producto: match.id_producto,
      codigo_barra: codigo,
      descripcion: match.nombre,
      nom_marca: match.nom_marca,
      cantidad: 1,
      precio_unitario: Number(match.precio),
      precio_total: Number(match.precio),
      stock: match.stock,
      id_sku: match.id_sku,
      sku_label: match.label || null,
      tipo_afectacion_igv: match.tipo_afectacion_igv,
    });
    setSearch("");
  };

  const handleCardClick = (product: POSProduct) => {
    if (product.tiene_variantes) {
      setPendingVariant(VARIANTE_SIN_ELEGIR);
      setVariantDialogProduct(product);
      return;
    }
    handleAddToCart(product);
  };

  const getCartQty = (productoId: number) => {
    return cartItems.filter((i) => i.id_producto === productoId).reduce((sum, i) => sum + i.cantidad, 0);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      {/* Vender contra datos viejos está bien; hacerlo sin saberlo, no. */}
      {esFoto && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-400">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>
            Sin conexión — catálogo de {fotoDe ? antiguedad(fotoDe) : "la última vez"}. Ya se descontó lo
            vendido en este equipo, pero el stock pudo cambiar en otra caja.
          </span>
        </div>
      )}
      {sinDatos && (
        <div className="flex items-center gap-2 bg-rose-50 border-b border-rose-200 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-400">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>Sin conexión y sin catálogo guardado en este equipo. Conéctate una vez para poder vender offline.</span>
        </div>
      )}

      {/* Header con búsqueda */}
      <div className="p-3 border-b border-border space-y-2">
        <SearchInput
          value={search}
          onChangeValue={setSearch}
          onKeyDown={handleScanEnter}
          placeholder="Buscar por nombre, código o barras… (Enter para escanear)"
          wrapperClassName="w-full max-w-none"
        />
        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoria(null)}
              className={[
                "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer",
                categoria === null
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-zinc-50 dark:hover:bg-zinc-900",
              ].join(" ")}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria((prev) => (prev === c ? null : c))}
                className={[
                  "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer",
                  categoria === c
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-zinc-50 dark:hover:bg-zinc-900",
                ].join(" ")}
              >
                {c}
              </button>
            ))}
          </div>
        )}
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
                  onClick={() => handleCardClick(product)}
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
                  <span className="text-xs font-medium text-foreground leading-tight line-clamp-2 mb-1 flex items-center gap-1">
                    {product.es_combo && (
                      <span className="shrink-0 rounded bg-primary/10 text-primary px-1 py-0.5 text-[9px] font-bold uppercase">
                        Combo
                      </span>
                    )}
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
                      outOfStock
                        ? "text-destructive"
                        : product.stock_min != null && product.stock <= Number(product.stock_min)
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground",
                    ].join(" ")}>
                      Stock: {product.stock}
                      {!outOfStock && product.stock_min != null && product.stock <= Number(product.stock_min) && " ⚠"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Elegir variante antes de agregar */}
      <Dialog open={!!variantDialogProduct} onOpenChange={(open) => !open && setVariantDialogProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {variantDialogProduct?.nombre}
            </DialogTitle>
          </DialogHeader>
          {variantDialogProduct && (
            <VariantPicker
              idProducto={variantDialogProduct.codigo}
              idAlmacen={selectedAlmacenId}
              onResolved={setPendingVariant}
              permitirColapsada
            />
          )}
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!pendingVariant.ready}
              onClick={() => {
                if (variantDialogProduct) handleAddToCart(variantDialogProduct, pendingVariant);
                setVariantDialogProduct(null);
              }}
            >
              Agregar al carrito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

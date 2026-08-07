import { getCategoria, getTags, formatPen, type StoreProducto } from "../../../types/storefront";

export function ProductSpecs({ producto }: { producto: StoreProducto }) {
  const cat = getCategoria(producto);
  const tags = getTags(producto);
  const rows = [
    producto.sku ? { k: "SKU", v: producto.sku } : null,
    cat ? { k: "Categoría", v: cat } : null,
    { k: "Stock", v: String(producto.stock) },
    { k: "Precio", v: formatPen(Number(producto.precio)) },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.k} className="contents">
            <dt className="store-muted">{r.k}</dt>
            <dd className="font-medium">{r.v}</dd>
          </div>
        ))}
      </dl>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((t) => (
            <span key={t} className="store-chip text-[11px] px-2 py-1 border store-hairline store-muted">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="text-xs text-red-500">Agotado</span>;
  if (stock <= 3)
    return <span className="text-xs font-medium" style={{ color: "var(--vitrina-accent)" }}>Últimas {stock}</span>;
  return <span className="text-xs store-muted">En stock</span>;
}

export function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--vitrina-mist,#0a0e14)] animate-pulse">
      <div className="h-14 bg-[var(--vitrina-fog,#161b22)]" />
      <div className="h-[50vh] bg-[var(--vitrina-fog,#161b22)] opacity-60" />
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-[var(--vitrina-fog,#161b22)] opacity-40 rounded-[var(--store-radius,14px)]" />
        ))}
      </div>
    </div>
  );
}

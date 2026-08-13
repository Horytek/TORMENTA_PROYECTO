import { useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, Rows3, X, PackageX } from "lucide-react";
import { ProductCover } from "./ProductCover";
import { FiltersSheet } from "./quick/FiltersSheet";
import type { OrdenOption, StockFilter } from "./hooks/useStorefrontCatalog";
import type { BrowseFacet } from "../../types/theme";
import type { StoreProducto } from "../../types/storefront";

type Props = {
  slug: string;
  title?: string;
  layout?: "sidebar" | "topbar";
  facets?: BrowseFacet[];
  totalCatalogo: number;
  filtrados: StoreProducto[];
  categorias: { nombre: string; count: number }[];
  allTags: { nombre: string; count: number }[];
  priceBounds: { min: number; max: number };
  busqueda: string;
  onBusqueda: (v: string) => void;
  categoria: string | null;
  onCategoria: (v: string | null) => void;
  orden: OrdenOption;
  onOrden: (v: OrdenOption) => void;
  dense: boolean;
  onDense: (v: boolean) => void;
  stockFilter: StockFilter;
  onStockFilter: (v: StockFilter) => void;
  minPrice: string;
  onMinPrice: (v: string) => void;
  maxPrice: string;
  onMaxPrice: (v: string) => void;
  tag: string | null;
  onTag: (v: string | null) => void;
  appliedCount: number;
  onClear: () => void;
  onAdd: (p: StoreProducto) => void;
  quickAdd?: boolean;
};

function FacetPanel(props: Omit<Props, "slug" | "filtrados" | "totalCatalogo" | "onAdd" | "quickAdd" | "dense" | "onDense" | "title" | "layout">) {
  const show = (f: BrowseFacet) => !props.facets || props.facets.includes(f);
  return (
    <div className="space-y-6 text-sm">
      {show("category") && props.categorias.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider store-muted mb-2">Categoría</p>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                className={`store-nav-btn w-full text-left px-2 py-2 min-h-11 ${!props.categoria ? "font-semibold text-[var(--vitrina-accent)]" : ""}`}
                onClick={() => props.onCategoria(null)}
              >
                Todas
              </button>
            </li>
            {props.categorias.map((c) => (
              <li key={c.nombre}>
                <button
                  type="button"
                  className={`store-nav-btn w-full text-left px-2 py-2 min-h-11 flex justify-between ${
                    props.categoria === c.nombre ? "font-semibold text-[var(--vitrina-accent)]" : ""
                  }`}
                  onClick={() => props.onCategoria(c.nombre)}
                >
                  <span>{c.nombre}</span>
                  <span className="store-muted">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {show("price") && (
        <div>
          <p className="text-[11px] uppercase tracking-wider store-muted mb-2">Precio (S/)</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder={String(props.priceBounds.min)}
              value={props.minPrice}
              onChange={(e) => props.onMinPrice(e.target.value)}
              className="store-input w-full h-11 px-2 border store-hairline bg-[var(--vitrina-elevated)] text-sm"
            />
            <input
              type="number"
              placeholder={String(props.priceBounds.max)}
              value={props.maxPrice}
              onChange={(e) => props.onMaxPrice(e.target.value)}
              className="store-input w-full h-11 px-2 border store-hairline bg-[var(--vitrina-elevated)] text-sm"
            />
          </div>
        </div>
      )}
      {show("stock") && (
        <div>
          <p className="text-[11px] uppercase tracking-wider store-muted mb-2">Disponibilidad</p>
          <div className="flex flex-col gap-1">
            {(
              [
                ["all", "Todos"],
                ["in_stock", "En stock"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={`store-nav-btn text-left px-2 py-2 min-h-11 ${props.stockFilter === v ? "font-semibold text-[var(--vitrina-accent)]" : ""}`}
                onClick={() => props.onStockFilter(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {show("tags") && props.allTags.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider store-muted mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {props.allTags.map((t) => (
              <button
                key={t.nombre}
                type="button"
                onClick={() => props.onTag(props.tag === t.nombre ? null : t.nombre)}
                className={`store-chip px-2.5 py-1.5 text-xs border store-hairline min-h-9 ${
                  props.tag === t.nombre ? "bg-[var(--vitrina-accent)] text-white border-transparent" : ""
                }`}
              >
                {t.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
      {props.appliedCount > 0 && (
        <button type="button" onClick={props.onClear} className="text-xs store-muted underline min-h-11">
          Limpiar filtros ({props.appliedCount})
        </button>
      )}
    </div>
  );
}

export function Browse(props: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const title = props.title || "Catálogo";
  const sidebar = props.layout !== "topbar";

  const appliedChips: { key: string; label: string; clear: () => void }[] = [];
  if (props.categoria)
    appliedChips.push({ key: "cat", label: props.categoria, clear: () => props.onCategoria(null) });
  if (props.tag) appliedChips.push({ key: "tag", label: props.tag, clear: () => props.onTag(null) });
  if (props.minPrice)
    appliedChips.push({ key: "min", label: `≥ S/ ${props.minPrice}`, clear: () => props.onMinPrice("") });
  if (props.maxPrice)
    appliedChips.push({ key: "max", label: `≤ S/ ${props.maxPrice}`, clear: () => props.onMaxPrice("") });
  if (props.stockFilter === "in_stock")
    appliedChips.push({ key: "stock", label: "En stock", clear: () => props.onStockFilter("all") });
  if (props.busqueda.trim())
    appliedChips.push({
      key: "q",
      label: `“${props.busqueda.trim()}”`,
      clear: () => props.onBusqueda(""),
    });

  return (
    <section id="catalogo" className="scroll-mt-24 py-10 lg:py-14 bg-[var(--vitrina-mist)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="vitrina-section-title text-xl sm:text-2xl">{title}</h2>
            <p className="text-sm store-muted mt-1">
              {props.filtrados.length} de {props.totalCatalogo} productos
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 sm:w-56 min-w-[10rem]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 store-muted" />
              <input
                value={props.busqueda}
                onChange={(e) => props.onBusqueda(e.target.value)}
                placeholder="Buscar…"
                className="store-input w-full h-11 pl-9 pr-3 border store-hairline bg-[var(--vitrina-elevated)] text-sm"
              />
            </div>
            <select
              value={props.orden}
              onChange={(e) => props.onOrden(e.target.value as OrdenOption)}
              className="store-input h-11 px-3 border store-hairline bg-[var(--vitrina-elevated)] text-sm min-w-[9rem]"
            >
              <option value="relevancia">Relevancia</option>
              <option value="recientes">Recientes</option>
              <option value="precio-asc">Precio ↑</option>
              <option value="precio-desc">Precio ↓</option>
              <option value="nombre-asc">Nombre A–Z</option>
              <option value="nombre-desc">Nombre Z–A</option>
            </select>
            <button
              type="button"
              className="store-btn lg:hidden h-11 px-3 border store-hairline inline-flex items-center gap-2 text-sm min-h-11"
              onClick={() => setSheetOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filtros
              {props.appliedCount > 0 && (
                <span className="store-badge text-[10px] px-1.5 py-0.5 bg-[var(--vitrina-accent)] text-white">
                  {props.appliedCount}
                </span>
              )}
            </button>
            <div className="hidden sm:flex border store-hairline overflow-hidden rounded-[var(--store-radius-sm)]">
              <button
                type="button"
                className={`size-11 flex items-center justify-center ${props.dense ? "bg-[var(--vitrina-fog)]" : ""}`}
                onClick={() => props.onDense(true)}
                aria-label="Vista densa"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                className={`size-11 flex items-center justify-center ${!props.dense ? "bg-[var(--vitrina-fog)]" : ""}`}
                onClick={() => props.onDense(false)}
                aria-label="Vista cómoda"
              >
                <Rows3 className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {appliedChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {appliedChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="store-chip inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border store-hairline bg-[var(--vitrina-elevated)] min-h-9"
              >
                {c.label}
                <X className="size-3" />
              </button>
            ))}
          </div>
        )}

        <div className={sidebar ? "lg:grid lg:grid-cols-[220px_1fr] lg:gap-8" : ""}>
          {sidebar && (
            <aside className="hidden lg:block sticky top-24 self-start store-panel p-4">
              <FacetPanel {...props} />
            </aside>
          )}

          {props.filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 store-muted text-sm gap-2">
              <PackageX className="size-8 opacity-40" />
              Sin resultados
              {props.appliedCount > 0 && (
                <button type="button" onClick={props.onClear} className="underline text-[var(--vitrina-accent)]">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                props.dense ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {props.filtrados.map((p) => (
                <ProductCover
                  key={p.id_producto}
                  producto={p}
                  slug={props.slug}
                  onAdd={props.onAdd}
                  quickAdd={props.quickAdd}
                  ratio={props.dense ? "portrait" : "square"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {sheetOpen && (
        <FiltersSheet onClose={() => setSheetOpen(false)}>
          <FacetPanel {...props} />
        </FiltersSheet>
      )}
    </section>
  );
}

/** @deprecated alias */
export { Browse as CatalogArena };

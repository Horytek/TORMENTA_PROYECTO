import { FeaturedStage } from "../FeaturedStage";
import { CategoryOrbit } from "../CategoryOrbit";
import { TrustStrip } from "../TrustStrip";
import { StoryTiles } from "../StoryTiles";
import { ProductRail } from "../ProductRail";
import { Browse } from "../Browse";
import { PromoBanner } from "../PromoBanner";
import { FaqBlock } from "../FaqBlock";
import { pickProductsByIds, resolveRowProducts } from "../hooks/useStorefrontCatalog";
import type { OrdenOption, StockFilter } from "../hooks/useStorefrontCatalog";
import type { StoreModule, StoreTheme } from "../../../types/theme";
import type { StoreProducto, StoreTienda } from "../../../types/storefront";

type CatalogApi = {
  busqueda: string;
  setBusqueda: (v: string) => void;
  categoria: string | null;
  setCategoria: (cat: string | null) => void;
  orden: OrdenOption;
  setOrden: (v: OrdenOption) => void;
  dense: boolean;
  setDense: (v: boolean) => void;
  stockFilter: StockFilter;
  setStockFilter: (v: StockFilter) => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  tag: string | null;
  setTag: (v: string | null) => void;
  categorias: { nombre: string; count: number }[];
  allTags: { nombre: string; count: number }[];
  priceBounds: { min: number; max: number };
  filtrados: StoreProducto[];
  destacados: StoreProducto[];
  storyProductos: StoreProducto[];
  clearFilters: () => void;
  appliedCount: number;
};

type Props = {
  modules: StoreModule[];
  theme: StoreTheme;
  tienda: StoreTienda;
  slug: string;
  productos: StoreProducto[];
  catalog: CatalogApi;
  onAdd: (p: StoreProducto) => void;
  quickAdd?: boolean;
};

export function ModuleRenderer({
  modules,
  tienda,
  slug,
  productos,
  catalog,
  onAdd,
  quickAdd = true,
}: Props) {
  const usedIds = new Set<number>();

  return (
    <>
      {modules
        .filter((m) => m.enabled)
        .map((mod) => {
          switch (mod.type) {
            case "spotlight": {
              const ids = mod.config.product_ids;
              const list = ids?.length
                ? pickProductsByIds(productos, ids, 5)
                : catalog.destacados;
              list.forEach((p) => usedIds.add(p.id_producto));
              return (
                <FeaturedStage
                  key={mod.id}
                  tienda={tienda}
                  slug={slug}
                  productos={list}
                  ctaLabel={mod.config.cta_label}
                  autoplayMs={mod.config.autoplay_ms}
                />
              );
            }
            case "featured": {
              const ids = mod.config.product_ids;
              const list = ids?.length
                ? pickProductsByIds(productos, ids, mod.config.layout === "trio" ? 3 : 2)
                : catalog.storyProductos;
              list.forEach((p) => usedIds.add(p.id_producto));
              return <StoryTiles key={mod.id} slug={slug} productos={list} />;
            }
            case "rows": {
              return (
                <div key={mod.id}>
                  {(mod.config.rows || []).map((row, i) => {
                    const list = resolveRowProducts(productos, row, usedIds);
                    list.forEach((p) => usedIds.add(p.id_producto));
                    return (
                      <ProductRail
                        key={`${mod.id}-${i}-${row.title}`}
                        title={row.title}
                        eyebrow={row.eyebrow}
                        productos={list}
                        slug={slug}
                        onAdd={onAdd}
                        quickAdd={quickAdd}
                      />
                    );
                  })}
                </div>
              );
            }
            case "categories":
              return (
                <CategoryOrbit
                  key={mod.id}
                  categorias={catalog.categorias}
                  activa={catalog.categoria}
                  onSelect={catalog.setCategoria}
                />
              );
            case "trust":
              return <TrustStrip key={mod.id} tienda={tienda} items={mod.config.items} />;
            case "promo":
              return (
                <PromoBanner
                  key={mod.id}
                  headline={mod.config.headline}
                  body={mod.config.body}
                  imageUrl={mod.config.image_url}
                  ctaLabel={mod.config.cta_label}
                  ctaHref={mod.config.cta_href}
                />
              );
            case "faq":
              return <FaqBlock key={mod.id} items={mod.config.items || []} />;
            case "browse":
              return (
                <Browse
                  key={mod.id}
                  slug={slug}
                  title={mod.config.title}
                  layout={mod.config.layout}
                  facets={mod.config.facets}
                  totalCatalogo={productos.length}
                  filtrados={catalog.filtrados}
                  categorias={catalog.categorias}
                  allTags={catalog.allTags}
                  priceBounds={catalog.priceBounds}
                  busqueda={catalog.busqueda}
                  onBusqueda={catalog.setBusqueda}
                  categoria={catalog.categoria}
                  onCategoria={catalog.setCategoria}
                  orden={catalog.orden}
                  onOrden={catalog.setOrden}
                  dense={catalog.dense}
                  onDense={catalog.setDense}
                  stockFilter={catalog.stockFilter}
                  onStockFilter={catalog.setStockFilter}
                  minPrice={catalog.minPrice}
                  onMinPrice={catalog.setMinPrice}
                  maxPrice={catalog.maxPrice}
                  onMaxPrice={catalog.setMaxPrice}
                  tag={catalog.tag}
                  onTag={catalog.setTag}
                  appliedCount={catalog.appliedCount}
                  onClear={catalog.clearFilters}
                  onAdd={onAdd}
                  quickAdd={quickAdd}
                />
              );
            default:
              return null;
          }
        })}
      {/* Ensure browse exists if modules omitted it */}
      {!modules.some((m) => m.type === "browse" && m.enabled) && (
        <Browse
          slug={slug}
          totalCatalogo={productos.length}
          filtrados={catalog.filtrados}
          categorias={catalog.categorias}
          allTags={catalog.allTags}
          priceBounds={catalog.priceBounds}
          busqueda={catalog.busqueda}
          onBusqueda={catalog.setBusqueda}
          categoria={catalog.categoria}
          onCategoria={catalog.setCategoria}
          orden={catalog.orden}
          onOrden={catalog.setOrden}
          dense={catalog.dense}
          onDense={catalog.setDense}
          stockFilter={catalog.stockFilter}
          onStockFilter={catalog.setStockFilter}
          minPrice={catalog.minPrice}
          onMinPrice={catalog.setMinPrice}
          maxPrice={catalog.maxPrice}
          onMaxPrice={catalog.setMaxPrice}
          tag={catalog.tag}
          onTag={catalog.setTag}
          appliedCount={catalog.appliedCount}
          onClear={catalog.clearFilters}
          onAdd={onAdd}
          quickAdd={quickAdd}
        />
      )}
    </>
  );
}

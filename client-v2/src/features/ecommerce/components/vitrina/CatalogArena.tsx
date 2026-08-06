import { Search, LayoutGrid, Rows3, PackageX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "./ProductCard";
import type { OrdenOption } from "./hooks/useStorefrontCatalog";
import type { StoreProducto } from "../../types/storefront";

type Props = {
  slug: string;
  totalCatalogo: number;
  filtrados: StoreProducto[];
  categorias: { nombre: string; count: number }[];
  busqueda: string;
  onBusqueda: (v: string) => void;
  categoria: string | null;
  onCategoria: (v: string | null) => void;
  orden: OrdenOption;
  onOrden: (v: OrdenOption) => void;
  dense: boolean;
  onDense: (v: boolean) => void;
  onAdd: (p: StoreProducto) => void;
};

export function CatalogArena({
  slug,
  totalCatalogo,
  filtrados,
  categorias,
  busqueda,
  onBusqueda,
  categoria,
  onCategoria,
  orden,
  onOrden,
  dense,
  onDense,
  onAdd,
}: Props) {
  return (
    <section id="catalogo" className="scroll-mt-24 bg-[var(--vitrina-mist)] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Arena</p>
          <h2 className="vitrina-display text-3xl sm:text-5xl mt-1">Catálogo completo</h2>
        </div>

        <div className="sticky top-[4.5rem] z-20 -mx-4 px-4 lg:mx-0 lg:px-0 py-3 mb-6 bg-[var(--vitrina-mist)]/95 backdrop-blur border-y border-slate-200/60 lg:border lg:rounded-2xl lg:px-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={busqueda}
                onChange={(e) => onBusqueda(e.target.value)}
                placeholder="Buscar por nombre, SKU o descripción…"
                className="pl-9 h-10 rounded-full bg-white border-slate-200"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={orden} onValueChange={(v) => onOrden(v as OrdenOption)}>
                <SelectTrigger className="w-[160px] h-10 rounded-full bg-white">
                  <SelectValue placeholder="Orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevancia">Relevancia</SelectItem>
                  <SelectItem value="precio-asc">Precio ↑</SelectItem>
                  <SelectItem value="precio-desc">Precio ↓</SelectItem>
                  <SelectItem value="nombre-asc">Nombre A–Z</SelectItem>
                  <SelectItem value="nombre-desc">Nombre Z–A</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-full border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => onDense(true)}
                  className={`size-9 rounded-full flex items-center justify-center ${dense ? "bg-[var(--vitrina-accent)] text-white" : "text-slate-500"}`}
                  aria-label="Vista densa"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDense(false)}
                  className={`size-9 rounded-full flex items-center justify-center ${!dense ? "bg-[var(--vitrina-accent)] text-white" : "text-slate-500"}`}
                  aria-label="Vista cómoda"
                >
                  <Rows3 className="size-4" />
                </button>
              </div>
              <span className="text-xs text-slate-500 ml-1">
                {filtrados.length} de {totalCatalogo}
              </span>
            </div>
          </div>
          {categorias.length > 0 && (
            <div className="flex gap-2 overflow-x-auto vitrina-hide-scrollbar mt-3 pb-0.5">
              <button
                type="button"
                onClick={() => onCategoria(null)}
                className={`vitrina-pill shrink-0 px-3 py-1.5 text-xs font-semibold border ${
                  !categoria
                    ? "text-white border-transparent"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
                style={!categoria ? { background: "var(--vitrina-accent)" } : undefined}
              >
                Todas
              </button>
              {categorias.map((c) => (
                <button
                  key={c.nombre}
                  type="button"
                  onClick={() => onCategoria(c.nombre)}
                  className={`vitrina-pill shrink-0 px-3 py-1.5 text-xs font-semibold border ${
                    categoria === c.nombre
                      ? "text-white border-transparent"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                  style={categoria === c.nombre ? { background: "var(--vitrina-accent)" } : undefined}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {totalCatalogo === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <PackageX className="size-10 mx-auto mb-3 opacity-50" />
            <p>Catálogo vacío por ahora.</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Search className="size-10 mx-auto mb-3 opacity-50" />
            <p>Sin resultados con estos filtros.</p>
            <button
              type="button"
              className="mt-4 text-sm font-semibold"
              style={{ color: "var(--vitrina-accent)" }}
              onClick={() => {
                onBusqueda("");
                onCategoria(null);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-4 sm:gap-5 ${
              dense
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filtrados.map((p, i) => (
              <ProductCard key={p.id_producto} producto={p} slug={slug} onAdd={onAdd} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

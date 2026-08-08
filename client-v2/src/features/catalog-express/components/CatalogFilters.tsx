import { Layers, RotateCcw, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type CatalogFiltersState = {
  categoria: string | null;
  marca: string | null;
  precioMin: string;
  precioMax: string;
  soloStock: boolean;
};

type Facet = { nombre: string; count: number };

type Props = {
  state: CatalogFiltersState;
  onChange: (patch: Partial<CatalogFiltersState>) => void;
  categorias: Facet[];
  marcas: Facet[];
  totalProductos: number;
  numFiltrosActivos: number;
  onReset: () => void;
};

function facetBtn(active: boolean) {
  return `w-full flex items-center justify-between rounded-[var(--cx-radius-sm)] px-3 py-2 text-xs transition-colors cx-focus ${
    active
      ? "font-semibold text-white"
      : "hover:bg-black/[0.04] text-[var(--cx-ink)]"
  }`;
}

export function CatalogFilters({
  state,
  onChange,
  categorias,
  marcas,
  totalProductos,
  numFiltrosActivos,
  onReset,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-[var(--cx-radius-sm)] border cx-hairline p-3 bg-[var(--cx-elevated)]">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Solo con stock</Label>
          <p className="text-[11px] cx-muted">Ocultar agotados</p>
        </div>
        <Switch
          checked={state.soloStock}
          onCheckedChange={(v) => onChange({ soloStock: v })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider cx-muted flex items-center gap-1.5">
            <Layers className="size-3.5" /> Categorías
          </p>
          {state.categoria && (
            <button
              type="button"
              onClick={() => onChange({ categoria: null })}
              className="text-[11px] font-medium text-[var(--cx-accent)] hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
          <button
            type="button"
            onClick={() => onChange({ categoria: null })}
            className={facetBtn(state.categoria === null)}
            style={state.categoria === null ? { background: "var(--cx-accent)" } : undefined}
          >
            <span>Todas</span>
            <span className="text-[10px] opacity-80">{totalProductos}</span>
          </button>
          {categorias.map((c) => {
            const active = state.categoria === c.nombre;
            return (
              <button
                key={c.nombre}
                type="button"
                onClick={() =>
                  onChange({ categoria: active ? null : c.nombre })
                }
                className={facetBtn(active)}
                style={active ? { background: "var(--cx-accent)" } : undefined}
              >
                <span className="truncate pr-2 text-left">{c.nombre}</span>
                <span className="text-[10px] opacity-80">{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {marcas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider cx-muted flex items-center gap-1.5">
              <Tag className="size-3.5" /> Marcas
            </p>
            {state.marca && (
              <button
                type="button"
                onClick={() => onChange({ marca: null })}
                className="text-[11px] font-medium text-[var(--cx-accent)] hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-0.5">
            <button
              type="button"
              onClick={() => onChange({ marca: null })}
              className={facetBtn(state.marca === null)}
              style={state.marca === null ? { background: "var(--cx-accent)" } : undefined}
            >
              <span>Todas</span>
              <span className="text-[10px] opacity-80">{totalProductos}</span>
            </button>
            {marcas.map((m) => {
              const active = state.marca === m.nombre;
              return (
                <button
                  key={m.nombre}
                  type="button"
                  onClick={() => onChange({ marca: active ? null : m.nombre })}
                  className={facetBtn(active)}
                  style={active ? { background: "var(--cx-accent)" } : undefined}
                >
                  <span className="truncate pr-2 text-left">{m.nombre}</span>
                  <span className="text-[10px] opacity-80">{m.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider cx-muted">
          Precio (S/)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Mín"
            value={state.precioMin}
            onChange={(e) => onChange({ precioMin: e.target.value })}
            className="text-xs h-9"
            min={0}
          />
          <Input
            type="number"
            placeholder="Máx"
            value={state.precioMax}
            onChange={(e) => onChange({ precioMax: e.target.value })}
            className="text-xs h-9"
            min={0}
          />
        </div>
      </div>

      {numFiltrosActivos > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="cx-focus w-full inline-flex items-center justify-center gap-2 h-9 text-xs font-medium rounded-[var(--cx-radius-sm)] border cx-hairline hover:bg-black/[0.03]"
        >
          <RotateCcw className="size-3.5" /> Restablecer filtros
        </button>
      )}
    </div>
  );
}

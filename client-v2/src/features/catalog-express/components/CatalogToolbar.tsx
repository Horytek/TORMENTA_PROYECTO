import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReactNode } from "react";

export type OrdenOption = "relevancia" | "precio-asc" | "precio-desc" | "nombre-asc" | "nombre-desc";

type Chip = { key: string; label: string; onClear: () => void };

type Props = {
  orden: OrdenOption;
  onOrden: (v: OrdenOption) => void;
  itemsPorPagina: number;
  onItemsPorPagina: (n: number) => void;
  numFiltrosActivos: number;
  mobileFiltersOpen: boolean;
  onMobileFiltersOpen: (v: boolean) => void;
  filtersPanel: ReactNode;
  chips: Chip[];
  onClearAll: () => void;
  showingFrom: number;
  showingTo: number;
  totalItems: number;
  pagina: number;
  totalPaginas: number;
};

export function CatalogToolbar({
  orden,
  onOrden,
  itemsPorPagina,
  onItemsPorPagina,
  numFiltrosActivos,
  mobileFiltersOpen,
  onMobileFiltersOpen,
  filtersPanel,
  chips,
  onClearAll,
  showingFrom,
  showingTo,
  totalItems,
  pagina,
  totalPaginas,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 cx-elevated p-2.5 sm:p-3">
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={mobileFiltersOpen} onOpenChange={onMobileFiltersOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="cx-focus flex-1 h-10 inline-flex items-center justify-center gap-2 text-xs font-medium rounded-full border cx-hairline"
              >
                <SlidersHorizontal className="size-4" />
                Filtros
                {numFiltrosActivos > 0 && (
                  <span className="size-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white bg-[var(--cx-accent)]">
                    {numFiltrosActivos}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="cx w-[min(100%,20rem)] overflow-y-auto bg-[var(--cx-elevated)]">
              <SheetHeader className="text-left pb-2">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <SlidersHorizontal className="size-4" /> Filtros
                </SheetTitle>
              </SheetHeader>
              <div className="pt-2">{filtersPanel}</div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-initial">
            <ArrowUpDown className="size-3.5 cx-muted shrink-0 hidden sm:block" />
            <Select value={orden} onValueChange={(v) => onOrden(v as OrdenOption)}>
              <SelectTrigger className="h-9 text-xs w-full sm:w-[160px] rounded-full">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevancia">Relevancia</SelectItem>
                <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
                <SelectItem value="nombre-asc">Nombre: A–Z</SelectItem>
                <SelectItem value="nombre-desc">Nombre: Z–A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={String(itemsPorPagina)} onValueChange={(v) => onItemsPorPagina(Number(v))}>
            <SelectTrigger className="h-9 text-xs w-[72px] rounded-full shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span key={c.key} className="cx-chip">
              {c.label}
              <button type="button" onClick={c.onClear} className="cx-focus rounded-full" aria-label="Quitar">
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-red-600 hover:underline px-1"
          >
            Limpiar todo
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs cx-muted">
        <span>
          Mostrando <strong className="text-[var(--cx-ink)]">{showingFrom}</strong>–
          <strong className="text-[var(--cx-ink)]">{showingTo}</strong> de{" "}
          <strong className="text-[var(--cx-ink)]">{totalItems}</strong>
        </span>
        {totalPaginas > 1 && (
          <span>
            Página <strong className="text-[var(--cx-ink)]">{pagina}</strong> / {totalPaginas}
          </span>
        )}
      </div>
    </div>
  );
}

export function CatalogPagination({
  pagina,
  totalPaginas,
  onPagina,
  className = "",
}: {
  pagina: number;
  totalPaginas: number;
  onPagina: (n: number) => void;
  className?: string;
}) {
  if (totalPaginas <= 1) return null;

  const pages = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1
  );

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <PageBtn disabled={pagina === 1} onClick={() => onPagina(1)} ariaLabel="Primera">
        <ChevronsLeft className="size-4" />
      </PageBtn>
      <PageBtn disabled={pagina === 1} onClick={() => onPagina(pagina - 1)} ariaLabel="Anterior">
        <ChevronLeft className="size-4" />
      </PageBtn>
      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const ellipsis = prev && p - prev > 1;
        return (
          <div key={p} className="flex items-center gap-1">
            {ellipsis && <span className="px-1 text-xs cx-muted">…</span>}
            <button
              type="button"
              onClick={() => onPagina(p)}
              className={`cx-focus size-8 text-xs font-semibold rounded-full ${
                pagina === p ? "text-white" : "border cx-hairline hover:bg-black/[0.03]"
              }`}
              style={pagina === p ? { background: "var(--cx-accent)" } : undefined}
            >
              {p}
            </button>
          </div>
        );
      })}
      <PageBtn
        disabled={pagina === totalPaginas}
        onClick={() => onPagina(pagina + 1)}
        ariaLabel="Siguiente"
      >
        <ChevronRight className="size-4" />
      </PageBtn>
      <PageBtn
        disabled={pagina === totalPaginas}
        onClick={() => onPagina(totalPaginas)}
        ariaLabel="Última"
      >
        <ChevronsRight className="size-4" />
      </PageBtn>
    </div>
  );
}

function PageBtn({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="cx-focus size-8 rounded-full border cx-hairline flex items-center justify-center disabled:opacity-35"
    >
      {children}
    </button>
  );
}

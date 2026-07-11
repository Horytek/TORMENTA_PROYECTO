import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { FieldDef, SortConfig, ViewMode } from "./types";
import { AdaptiveRecord, RecordSkeleton } from "./AdaptiveRecord";
import { AdaptiveCard, CardSkeleton } from "./AdaptiveCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  AlignJustify,
  SlidersHorizontal,
  Plus,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Tipo local
// ─────────────────────────────────────────────────────────────────
type AnyRecord = object;

// ─────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────
export type LayoutMode = "list" | "card";

interface CollectionProps<T extends AnyRecord> {
  title?: string;
  items: T[];
  fields: FieldDef<T>[];
  actions?: import("./types").RecordAction[];
  globalActions?: import("./types").CollectionAction[];
  isLoading?: boolean;
  filters?: import("./types").CollectionFilter[];
  sort?: import("./types").SortConfig;
  onSort?: (s: import("./types").SortConfig) => void;
  search?: string;
  searchPlaceholder?: string;
  onSearch?: (v: string) => void;
  availableFields?: FieldDef<T>[];
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  onRecordClick?: (item: T) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (v: ViewMode) => void;
  layout?: LayoutMode;
  getItemId?: (item: T) => string | number;
  getRhythm?: (item: T, index: number) => import("./types").RhythmConfig;
  empty?: { title: string; description?: string; action?: { label: string; onClick: () => void } };
  expandedId?: string | number | null;
  renderExpanded?: (item: T) => React.ReactNode;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────
// Iconos de vista
// ─────────────────────────────────────────────────────────────────
const VIEW_ICONS: Record<ViewMode, React.ReactNode> = {
  compact:     <LayoutGrid className="h-3.5 w-3.5" />,
  comfortable: <LayoutList className="h-3.5 w-3.5" />,
  expanded:    <AlignJustify className="h-3.5 w-3.5" />,
};

const VIEW_LABELS: Record<ViewMode, string> = {
  compact:    "Compacta",
  comfortable:"Cómoda",
  expanded:   "Expandida",
};

// ─────────────────────────────────────────────────────────────────
// Header de la colección
// ─────────────────────────────────────────────────────────────────
function CollectionHeader({
  title,
  count,
  search,
  searchPlaceholder,
  onSearch,
  viewMode,
  onViewModeChange,
  sort,
  onSort,
  filters,
  globalActions,
  selectedIds,
  onSelectionChange,
}: {
  title?: string;
  count: number;
  search?: string;
  searchPlaceholder?: string;
  onSearch?: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  sort?: import("./types").SortConfig;
  onSort?: (s: import("./types").SortConfig) => void;
  filters?: import("./types").CollectionFilter[];
  globalActions?: import("./types").CollectionAction[];
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4 mb-6">
      {/* Title & Count in vertical stack */}
      <div className="space-y-1">
        {title && (
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        )}
        <p className="text-sm text-muted-foreground">
          {count.toLocaleString()} {title ? title.toLowerCase() : "registros"} registrados
        </p>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border/40" />

      {/* Search and Filters / Actions Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        {onSearch && (
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" strokeWidth={1.5} />
            <Input
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder={searchPlaceholder ?? "Buscar…"}
              className="h-9 pl-10 pr-4 text-sm bg-card/50 border-border/80 focus-visible:ring-1 focus-visible:ring-ring rounded-xl w-full"
            />
          </div>
        )}

        {/* Global Actions / Filters */}
        <div className="flex items-center gap-2 shrink-0">
          {onSelectionChange && selectedIds !== undefined && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-muted-foreground">{selectedIds.length} sel.</span>
              <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs rounded-xl" onClick={() => onSelectionChange([])}>Limpiar</Button>
              {globalActions?.map(action => (
                <Button key={action.id} variant="default" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-xl"
                  onClick={() => action.onClick(selectedIds)} disabled={action.disabled}>
                  {action.icon}{action.label}
                </Button>
              ))}
            </div>
          )}

          {filters && filters.length > 0 && (
            <Button
              variant="ghost" size="sm" className={cn("h-8 w-8 p-0 rounded-xl", showFilters && "bg-zinc-100 dark:bg-zinc-800")}
              onClick={() => setShowFilters(v => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Panel */}
      {showFilters && filters && filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {filters.map(filter => (
            <div key={filter.id} className="flex items-center gap-1.5">
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="h-8 text-xs w-auto min-w-[120px] rounded-xl"><SelectValue placeholder={filter.label} /></SelectTrigger>
                <SelectContent>
                  {filter.options.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty state — editorial minimalista
// ─────────────────────────────────────────────────────────────────
function EmptyState({ title, description, action }: { title: string; description?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/50 py-20 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
        <Info className="h-5 w-5 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-medium text-foreground/70">{title}</h3>
      {description && <p className="mt-1.5 text-xs text-muted-foreground/50">{description}</p>}
      {action && (
        <Button variant="default" size="sm" className="mt-4 gap-1.5" onClick={action.onClick}>
          <Plus className="h-3.5 w-3.5" />{action.label}
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Selector de columnas visibles
// ─────────────────────────────────────────────────────────────────
function ColumnSelector<T extends Record<string, unknown>>({
  availableFields, fields, onChange,
}: {
  availableFields?: FieldDef<T>[]; fields: FieldDef<T>[]; onChange: (fields: FieldDef<T>[]) => void;
}) {
  const selectedKeys = new Set(fields.map(f => f.key));
  const toggle = (key: string) => {
    if (selectedKeys.has(key)) { if (selectedKeys.size > 1) onChange(fields.filter(f => f.key !== key)); }
    else { const def = availableFields?.find(f => f.key === key); if (def) onChange([...fields, def]); }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><SlidersHorizontal className="h-3.5 w-3.5" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Columnas visibles</div>
        <DropdownMenuSeparator />
        {(availableFields ?? fields).map(field => (
          <DropdownMenuItem key={field.key} onClick={() => toggle(field.key)} className="gap-2 cursor-pointer">
            <span className={cn("h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
              selectedKeys.has(field.key) ? "bg-blue-500 border-blue-500 text-white" : "border-zinc-300 dark:border-zinc-600"
            )}>
              {selectedKeys.has(field.key) && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            <span className="text-xs">{field.label ?? field.key}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────
export function AdaptiveCollection<T extends AnyRecord>({
  title,
  items,
  fields,
  actions,
  globalActions,
  isLoading,
  filters,
  sort,
  onSort,
  search,
  searchPlaceholder,
  onSearch,
  availableFields,
  selectedIds,
  onSelectionChange,
  onRecordClick,
  viewMode: controlledViewMode,
  onViewModeChange,
  layout = "list",
  getItemId,
  getRhythm,
  empty,
  expandedId,
  renderExpanded,
  page,
  totalPages,
  onPageChange,
  serverSide,
  totalCount,
  className,
}: CollectionProps<T> & {
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  serverSide?: boolean;
  totalCount?: number;
}) {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("comfortable");
  const [internalSort, setInternalSort] = useState<SortConfig | undefined>(sort);
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  const getId = useCallback((item: T) => {
    if (getItemId) return getItemId(item);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallback = (item as any).id ?? Math.random();
    return String(fallback);
  }, [getItemId]);

  // Filtro local de búsqueda
  const filtered = useMemo(() => {
    if (serverSide) return items;
    let result = [...items];
    if (search?.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        fields.some(field => {
          const val = item[field.key as keyof T];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    if (filters) {
      filters.forEach(f => {
        if (f.value) result = result.filter(item => {
          const val = item[f.id as keyof T];
          return String(val ?? "") === f.value;
        });
      });
    }
    return result;
  }, [items, search, fields, filters, serverSide]);

  // Ordenamiento
  const sorted = useMemo(() => {
    if (serverSide) return filtered;
    if (!internalSort || internalSort.field === "default") return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[internalSort.field as keyof T];
      const bVal = b[internalSort.field as keyof T];
      const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { numeric: true });
      return internalSort.direction === "asc" ? cmp : -cmp;
    });
  }, [filtered, internalSort, serverSide]);

  const handleSort = useCallback((s: SortConfig) => { setInternalSort(s); onSort?.(s); }, [onSort]);

  const handleRecordClick = useCallback((item: T) => {
    if (expandedId !== undefined && renderExpanded) onRecordClick?.(item);
    else onRecordClick?.(item);
  }, [expandedId, renderExpanded, onRecordClick]);

  const hasContent = !isLoading && sorted.length > 0;

  return (
    <div className={cn("w-full", className)}>
      <CollectionHeader
        title={title} count={totalCount !== undefined ? totalCount : (items ? items.length : 0)}
        search={search} searchPlaceholder={searchPlaceholder} onSearch={onSearch}
        viewMode={viewMode} onViewModeChange={setViewMode}
        sort={internalSort} onSort={handleSort}
        filters={filters} globalActions={globalActions}
        selectedIds={selectedIds} onSelectionChange={onSelectionChange}
      />

      {/* ── Selector de columnas ── */}
      {availableFields && availableFields.length > 0 && (
        <div className="flex justify-end mb-3 -mt-1">
          <ColumnSelector
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            availableFields={availableFields as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fields={fields as any}
            onChange={() => {}}
          />
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && layout === "card" && <CardSkeleton count={6} />}
      {isLoading && layout === "list" && (
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <RecordSkeleton key={i} />)}
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && sorted.length === 0 && empty && (
        <EmptyState title={empty.title} description={empty.description} action={empty.action} />
      )}
      {!isLoading && sorted.length === 0 && !empty && (
        <EmptyState
          title="Sin resultados"
          description={search ? `Ningún registro coincide con "${search}"` : "No hay registros"}
        />
      )}

      {/* ── LAYOUT: CARD GRID ── */}
      {hasContent && layout === "card" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((item, index) => (
            <AdaptiveCard<any>
              key={String(getId(item))}
              item={item}
              index={index}
              fields={fields}
              actions={actions ?? []}
              rhythm={getRhythm ? getRhythm(item, index) : undefined}
              getItemId={getId}
            />
          ))}
        </div>
      )}

      {/* ── LAYOUT: LIST ── */}
      {hasContent && layout === "list" && (
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          {/* Column Header Row */}
          {viewMode !== "compact" && (
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider border-b border-border bg-muted/20 select-none">
              <div className="col-span-5 pl-7">Descripción</div>
              <div className="col-span-2">Marca / Subcategoría</div>
              <div className="col-span-2 text-left md:text-center">Código</div>
              <div className="col-span-2 text-left md:text-right">Precio / Estado</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>
          )}
          <div className="divide-y divide-border/40">
            {sorted.map((item, index) => {
              const id = getId(item);
              const rhythm = getRhythm ? getRhythm(item, index) : undefined;
              const isSelected = selectedIds?.includes(id) ?? false;
              const isExpanded = expandedId === id;
              return (
                <div key={String(id)}>
                  <AdaptiveRecord<any>
                    item={item} index={index} fields={fields}
                    actions={actions} rhythm={rhythm} viewMode={viewMode}
                    isSelected={isSelected} isExpanded={isExpanded}
                    onSelect={onSelectionChange ? (sid) => {
                      const current = selectedIds ?? [];
                      const next = current.includes(sid) ? current.filter(x => x !== sid) : [...current, sid];
                      onSelectionChange(next);
                    } : undefined}
                    onRecordClick={handleRecordClick} getItemId={getId}
                  />
                  {isExpanded && renderExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border/40 bg-zinc-50/30 dark:bg-zinc-900/30">
                      {renderExpanded(item)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PAGINATION CONTROLLER ── */}
      {totalPages !== undefined && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 select-none">
          <div className="text-xs text-muted-foreground">
            {page !== undefined && <span>Página {page} de {totalPages}</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1 rounded-xl cursor-pointer"
              onClick={() => onPageChange(Math.max((page ?? 1) - 1, 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1 rounded-xl cursor-pointer"
              onClick={() => onPageChange(Math.min((page ?? 1) + 1, totalPages))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { AdaptiveRecord, RecordSkeleton } from "./AdaptiveRecord";
export { AdaptiveCard, CardSkeleton } from "./AdaptiveCard";

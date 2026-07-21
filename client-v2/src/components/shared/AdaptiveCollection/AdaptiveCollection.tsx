import React, { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { FieldDef, SortConfig, ViewMode, GroupByConfig } from "./types";
import { sortFieldsByPriority, filterByCapability, buildCsv } from "./types";
import { usePermissions } from "@/hooks/usePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdaptiveRecord, RecordSkeleton } from "./AdaptiveRecord";
import { AdaptiveCard, CardSkeleton } from "./AdaptiveCard";
import { AdaptiveTable, TableSkeleton } from "./AdaptiveTable";
import { SearchInput } from "@/components/shared/SearchInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SlidersHorizontal,
  Plus,
  Info,
  Download,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Tipo local
// ─────────────────────────────────────────────────────────────────
type AnyRecord = object;

// ─────────────────────────────────────────────────────────────────
// Layout — "auto" resuelve card en móvil / table en escritorio (la
// tabla real es la vista más intuitiva para datos densos con muchas
// columnas). "list" y "card" siguen disponibles como modos explícitos.
// ─────────────────────────────────────────────────────────────────
export type LayoutMode = "list" | "card" | "table" | "auto";

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
  groupBy?: GroupByConfig<T>;
  exportFileName?: string;
}

// ─────────────────────────────────────────────────────────────────
// Header de la colección
// ─────────────────────────────────────────────────────────────────
function CollectionHeader({
  title,
  count,
  search,
  searchPlaceholder,
  onSearch,
  viewMode: _viewMode,
  onViewModeChange: _onViewModeChange,
  sort: _sort,
  onSort: _onSort,
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
          <SearchInput
            value={search ?? ""}
            onChangeValue={onSearch}
            placeholder={searchPlaceholder ?? "Buscar…"}
            wrapperClassName="max-w-md"
          />
        )}

        {/* Global Actions / Filters */}
        <div className="flex items-center gap-2 shrink-0">
          {onSelectionChange && selectedIds !== undefined && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-muted-foreground">{selectedIds.length} sel.</span>
              <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs rounded-xl" onClick={() => onSelectionChange([])}>Limpiar</Button>
            </div>
          )}

          {globalActions && globalActions.length > 0 && (
            <div className="flex items-center gap-2">
              {globalActions.map(action => (
                <Button key={action.id} variant="default" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-xl"
                  onClick={() => action.onClick(selectedIds ?? [])} disabled={action.disabled}>
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

/**
 * Encabezados del modo lista, derivados de los `fields` reales en vez de un
 * grid fijo pensado solo para catálogos de producto ("Descripción / Marca /
 * Código / Precio-Estado"). Mantiene el mismo grid de 12 columnas que usa
 * `AdaptiveRecord` (col 1-5 / 6-7 / 8-9 / 10-11 / 12) — solo cambian las
 * etiquetas, no la disposición.
 */
function deriveListHeaders<T>(fields: FieldDef<T>[]): { primary: string; detail: string; code: string; value: string; hasDetail: boolean } {
  const sorted = sortFieldsByPriority(fields);
  const primary = sorted.find(f => f.priority === "primary");
  const secondary = sorted.filter(f => f.priority === "secondary");
  const meta = sorted.filter(f => f.priority === "meta");

  // Col 6-7: Secondary Detail Chips / Text
  const detailFields = secondary.filter(f => f.semantic === "chip" || f.semantic === "text" || f.semantic === "icon-text");

  // Col 8-9: Code / Unit / Barcode
  const codeFields = [...meta.filter(f => f.semantic === "code" || f.semantic === "barcode"), ...secondary.filter(f => f.semantic === "code" || f.semantic === "barcode")];
  const primaryCode = codeFields[0];

  // Col 10-11: Price / Number AND Badges / Status (excluding any field in Col 6-7 or Col 8-9)
  const valueFields = secondary.filter(f =>
    (f.semantic === "number" || f.semantic === "badge" || f.semantic === "status-dot" || f.key.includes("estado")) &&
    f.key !== primaryCode?.key &&
    !detailFields.some(d => d.key === f.key)
  );

  return {
    primary: primary?.label ?? "Descripción",
    detail: detailFields.map(f => f.label).filter(Boolean).join(" / ") || "",
    code: primaryCode?.label ?? "ID",
    value: valueFields.map(f => f.label).filter(Boolean).join(" / ") || "Estado",
    hasDetail: detailFields.length > 0,
  };
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
  groupBy,
  exportFileName,
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

  // Permisos: campos y acciones pueden declarar `capability` — se filtran acá,
  // así ningún consumidor tiene que condicionar sus configs a mano.
  const { can } = usePermissions();
  const permittedFields = useMemo(() => filterByCapability(fields, can), [fields, can]);
  const permittedActions = useMemo(() => filterByCapability(actions ?? [], can), [actions, can]);

  // Layout "auto": card en móvil, table (tabla real) en escritorio.
  const isMobile = useIsMobile();
  const resolvedLayout: "list" | "card" | "table" = layout === "auto" ? (isMobile ? "card" : "table") : layout;

  // Columnas visibles (selector opcional). Se guardan solo las CLAVES elegidas
  // por el usuario (null = default) y las columnas se derivan en render.
  // Nunca espejamos props en estado con useEffect: los consumidores pasan
  // `fields` inline (referencia nueva en cada render) y eso producía un
  // "Maximum update depth exceeded".
  const [selectedKeys, setSelectedKeys] = useState<string[] | null>(null);
  const permittedAvailable = useMemo(
    () => (availableFields && availableFields.length > 0 ? filterByCapability(availableFields, can) : null),
    [availableFields, can]
  );
  const renderFields = useMemo(() => {
    if (!permittedAvailable || selectedKeys === null) return permittedFields;
    return permittedAvailable.filter((f) => selectedKeys.includes(f.key));
  }, [permittedAvailable, permittedFields, selectedKeys]);

  const [internalPage, setInternalPage] = useState(1);

  // Dep serializada: los consumidores crean `filters` inline en cada render;
  // comparar por valores evita re-ejecutar el efecto innecesariamente.
  const filterSignature = filters?.map((f) => `${f.id}:${f.value ?? ""}`).join("|") ?? "";
  useEffect(() => {
    setInternalPage(1);
  }, [search, filterSignature]);

  const getId = useCallback((item: T) => {
    if (getItemId) {
      const val = getItemId(item);
      if (val !== undefined && val !== null && String(val) !== "NaN") return String(val);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallback = (item as any).id_sucursal ?? (item as any).id ?? (item as any).id_usuario ?? (item as any).dni ?? Math.random();
    return String(fallback);
  }, [getItemId]);

  // Filtro local de búsqueda
  const filtered = useMemo(() => {
    if (serverSide) return items;
    let result = [...items];
    if (search?.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        permittedFields.some(field => {
          const val = item[field.key as keyof T];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    // (la búsqueda solo mira campos permitidos — no filtra por datos que el usuario no ve)
    if (filters) {
      filters.forEach(f => {
        if (f.value) result = result.filter(item => {
          const val = item[f.id as keyof T];
          return String(val ?? "") === f.value;
        });
      });
    }
    return result;
  }, [items, search, permittedFields, filters, serverSide]);

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

  const itemsPerPage = 12;
  const isClientSidePaging = !serverSide && page === undefined;
  const currentPage = isClientSidePaging ? internalPage : (page ?? 1);
  const displayTotalPages = isClientSidePaging ? Math.ceil(sorted.length / itemsPerPage) : (totalPages ?? 1);
  const displayPageChange = isClientSidePaging ? (p: number) => setInternalPage(p) : onPageChange;

  const paginatedItems = useMemo(() => {
    if (!isClientSidePaging) return sorted;
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, isClientSidePaging, currentPage]);

  const hasContent = !isLoading && sorted.length > 0;

  // Agrupación por campo: parte la página actual en grupos ordenados (estado,
  // categoría, sucursal…). Sin `groupBy`, un único grupo anónimo.
  const groupedItems = useMemo((): { key: string; value: unknown; items: T[] }[] => {
    if (!groupBy) return [{ key: "__all__", value: null, items: paginatedItems }];
    const map = new Map<string, { value: unknown; items: T[] }>();
    for (const item of paginatedItems) {
      const value = item[groupBy.field as keyof T];
      const key = String(value ?? "—");
      const group = map.get(key) ?? { value, items: [] };
      group.items.push(item);
      map.set(key, group);
    }
    return Array.from(map.entries()).map(([key, g]) => ({ key, ...g }));
  }, [paginatedItems, groupBy]);

  const renderGroupHeader = (g: { key: string; value: unknown; items: T[] }) =>
    groupBy ? (
      <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 bg-muted/30 border-b border-border/40 select-none">
        {groupBy.label ? groupBy.label(g.value, g.items) : g.key}
        <span className="font-normal normal-case tracking-normal text-muted-foreground/50">{g.items.length}</span>
      </div>
    ) : null;

  // Exportación CSV (con BOM para Excel) sobre todos los registros filtrados.
  const handleExport = useCallback(() => {
    const csv = buildCsv(sorted, renderFields);
    // "﻿" = BOM para que Excel abra el CSV como UTF-8
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName ?? "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted, renderFields, exportFileName]);

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

      {/* ── Selector de columnas / Exportar ── */}
      {((availableFields && availableFields.length > 0) || exportFileName) && (
        <div className="flex justify-end items-center gap-1 mb-3 -mt-1">
          {exportFileName && (
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs gap-1.5 rounded-xl" onClick={handleExport} disabled={!hasContent}>
              <Download className="h-3.5 w-3.5" />Exportar
            </Button>
          )}
          {permittedAvailable && (
            <ColumnSelector
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              availableFields={permittedAvailable as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              fields={renderFields as any}
              onChange={(next) => setSelectedKeys((next as FieldDef<T>[]).map((f) => f.key))}
            />
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && resolvedLayout === "card" && <CardSkeleton count={6} />}
      {isLoading && resolvedLayout === "table" && <TableSkeleton columns={renderFields.length || 5} />}
      {isLoading && resolvedLayout === "list" && (
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
      {hasContent && resolvedLayout === "card" && (
        <div className="space-y-3">
          {groupedItems.map((group) => (
            <div key={group.key}>
              {renderGroupHeader(group)}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.items.map((item, index) => (
                  <AdaptiveCard<any>
                    key={String(getId(item))}
                    item={item}
                    index={index}
                    fields={renderFields}
                    actions={permittedActions}
                    rhythm={getRhythm ? getRhythm(item, index) : undefined}
                    getItemId={getId}
                    onClick={onRecordClick ? () => handleRecordClick(item) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LAYOUT: TABLE ── */}
      {hasContent && resolvedLayout === "table" && (
        <AdaptiveTable<any>
          groups={groupedItems.map((g) => ({
            key: g.key,
            label: groupBy ? (
              <>
                {groupBy.label ? groupBy.label(g.value, g.items) : g.key}
                <span className="font-normal normal-case tracking-normal text-muted-foreground/50 ml-1.5">{g.items.length}</span>
              </>
            ) : undefined,
            items: g.items,
          }))}
          fields={renderFields}
          actions={permittedActions}
          getItemId={getId}
          getRhythm={getRhythm}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          onRecordClick={onRecordClick ? handleRecordClick : undefined}
          expandedId={expandedId}
          renderExpanded={renderExpanded}
          sort={internalSort}
          onSort={handleSort}
        />
      )}

      {/* ── LAYOUT: LIST ── */}
      {hasContent && resolvedLayout === "list" && (
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          {/* Column Header Row */}
          {viewMode !== "compact" && (() => {
            const headers = deriveListHeaders(renderFields);
            return (
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider border-b border-border bg-muted/20 select-none">
                {headers.hasDetail ? (
                  <>
                    <div className="col-span-5 pl-7">{headers.primary}</div>
                    <div className="col-span-2">{headers.detail}</div>
                    <div className="col-span-2 text-left md:text-center">{headers.code}</div>
                    <div className="col-span-2 text-left md:text-right">{headers.value}</div>
                  </>
                ) : (
                  <>
                    <div className="col-span-6 pl-7">{headers.primary}</div>
                    <div className="col-span-3 text-left md:text-center">{headers.code}</div>
                    <div className="col-span-2 text-left md:text-right">{headers.value}</div>
                  </>
                )}
                <div className="col-span-1 text-right">Acciones</div>
              </div>
            );
          })()}
          {groupedItems.map((group) => (
            <div key={group.key}>
              {renderGroupHeader(group)}
              <div className="divide-y divide-border/40">
                {group.items.map((item, index) => {
                  const id = getId(item);
                  const rhythm = getRhythm ? getRhythm(item, index) : undefined;
                  const isSelected = selectedIds?.includes(id) ?? false;
                  const isExpanded = expandedId === id;
                  return (
                    <div key={String(id)}>
                      <AdaptiveRecord<any>
                        item={item} index={index} fields={renderFields}
                        actions={permittedActions} rhythm={rhythm} viewMode={viewMode}
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
          ))}
        </div>
      )}

      {/* ── PAGINATION CONTROLLER ── */}
      {displayTotalPages > 1 && displayPageChange && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40 select-none">
          <div className="text-xs text-muted-foreground">
            <span>Página {currentPage} de {displayTotalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1 rounded-xl cursor-pointer"
              onClick={() => displayPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1 rounded-xl cursor-pointer"
              onClick={() => displayPageChange(Math.min(currentPage + 1, displayTotalPages))}
              disabled={currentPage === displayTotalPages}
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

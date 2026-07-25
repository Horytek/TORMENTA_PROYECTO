// ─────────────────────────────────────────────────────────────────
// AdaptiveTable — vista tabular real (columnas por campo, no un grid
// de 4 zonas fijas como AdaptiveRecord). Pensada para escritorio: datos
// densos, muchas columnas, comparación fila a fila. Reutiliza los mismos
// renderizadores/acciones/ritmo que list y card — cero lógica de negocio
// propia, solo presentación.
// ─────────────────────────────────────────────────────────────────
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FieldDef, RecordAction, RhythmConfig, SortConfig } from "./types";
import { sortFieldsByPriority, splitCollapsible } from "./types";
import { renderField } from "./fieldRenderers";
import { RecordActions, RhythmMarker } from "./AdaptiveRecord";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

// Alineación/ancho por semántica — evita que números y fechas floten a la
// izquierda o que el título quede apretado junto a columnas cortas.
// Tipado estructural (solo `semantic`) en vez de `FieldDef<T>` genérico: evita
// fricción de varianza de funciones al llamarlo con FieldDef<T> concretos.
function columnClass(field: { semantic?: FieldDef<unknown>["semantic"] }): string {
  switch (field.semantic) {
    case "number":
    case "kpi":
      return "text-right whitespace-nowrap";
    case "date":
    case "code":
    case "barcode":
      return "whitespace-nowrap";
    case "badge":
    case "status-dot":
      return "whitespace-nowrap";
    case "title":
      return "min-w-[180px]";
    default:
      return "";
  }
}

function SortIcon({ active, direction }: { active: boolean; direction?: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40" />;
  return direction === "asc"
    ? <ChevronUp className="h-3 w-3 text-foreground" />
    : <ChevronDown className="h-3 w-3 text-foreground" />;
}

export interface TableGroup<T> {
  key: string;
  /** Encabezado de grupo (nombre + conteo). Sin él, no se pinta fila divisoria. */
  label?: ReactNode;
  items: T[];
}

interface AdaptiveTableProps<T> {
  groups: TableGroup<T>[];
  fields: FieldDef<T>[];
  actions?: RecordAction[];
  getItemId: (item: T) => string | number;
  getRhythm?: (item: T, index: number) => RhythmConfig;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  onRecordClick?: (item: T) => void;
  expandedId?: string | number | null;
  renderExpanded?: (item: T) => ReactNode;
  sort?: SortConfig;
  onSort?: (sort: SortConfig) => void;
}

export function AdaptiveTable<T extends Record<string, unknown>>({
  groups,
  fields,
  actions = [],
  getItemId,
  getRhythm,
  selectedIds,
  onSelectionChange,
  onRecordClick,
  expandedId,
  renderExpanded,
  sort,
  onSort,
}: AdaptiveTableProps<T>) {
  const sorted = sortFieldsByPriority(fields);
  const { visible: columns, collapsible } = splitCollapsible(sorted);
  const hasExpand = !!renderExpanded || collapsible.length > 0;
  const allIds = groups.flatMap((g) => g.items.map(getItemId));
  const allSelected = onSelectionChange && allIds.length > 0 && allIds.every((id) => selectedIds?.includes(id));
  const someSelected = onSelectionChange && allIds.some((id) => selectedIds?.includes(id)) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : allIds);
  };
  const toggleOne = (id: string | number) => {
    if (!onSelectionChange) return;
    const current = selectedIds ?? [];
    onSelectionChange(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    const direction: "asc" | "desc" = sort?.field === key && sort.direction === "asc" ? "desc" : "asc";
    onSort({ field: key, direction });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {onSelectionChange && (
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              {getRhythm && <th className="w-6" />}
              {columns.map((field) => (
                <th
                  key={field.key}
                  className={cn(
                    "px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 select-none",
                    columnClass(field)
                  )}
                >
                  {onSort ? (
                    <button
                      type="button"
                      onClick={() => handleSort(field.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      {field.label ?? field.key}
                      <SortIcon active={sort?.field === field.key} direction={sort?.direction} />
                    </button>
                  ) : (
                    field.label ?? field.key
                  )}
                </th>
              ))}
              {actions.length > 0 && <th className="w-10 px-3 py-2.5" />}
              {hasExpand && <th className="w-8" />}
            </tr>
          </thead>
          {groups.map((group) => {
            const colSpan =
              columns.length +
              (onSelectionChange ? 1 : 0) +
              (getRhythm ? 1 : 0) +
              (actions.length > 0 ? 1 : 0) +
              (hasExpand ? 1 : 0);
            return (
              <tbody key={group.key} className="divide-y divide-border/40">
                {group.label && (
                  <tr className="bg-muted/30">
                    <td
                      colSpan={colSpan}
                      className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 border-y border-border/40 select-none"
                    >
                      {group.label}
                    </td>
                  </tr>
                )}
                {group.items.map((item, index) => {
                  const id = getItemId(item);
                  const isSelected = selectedIds?.includes(id) ?? false;
                  const isExpanded = expandedId === id;
                  const rhythm = getRhythm ? getRhythm(item, index) : undefined;
                  return (
                    <TableRow
                      key={String(id)}
                      item={item}
                      index={index}
                      columns={columns}
                      collapsible={collapsible}
                      actions={actions}
                      rhythm={rhythm}
                      showRhythm={!!getRhythm}
                      isSelected={isSelected}
                      isExpanded={isExpanded}
                      hasExpand={hasExpand}
                      onToggleSelect={onSelectionChange ? () => toggleOne(id) : undefined}
                      onRecordClick={onRecordClick ? () => onRecordClick(item) : undefined}
                      renderExpanded={renderExpanded}
                      colSpan={colSpan}
                    />
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}

function TableRow<T extends Record<string, unknown>>({
  item,
  index,
  columns,
  collapsible,
  actions,
  rhythm,
  showRhythm,
  isSelected,
  isExpanded,
  hasExpand,
  onToggleSelect,
  onRecordClick,
  renderExpanded,
  colSpan,
}: {
  item: T;
  index: number;
  columns: FieldDef<T>[];
  collapsible: FieldDef<T>[];
  actions: RecordAction[];
  rhythm?: RhythmConfig;
  showRhythm: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  hasExpand: boolean;
  onToggleSelect?: () => void;
  onRecordClick?: () => void;
  renderExpanded?: (item: T) => ReactNode;
  colSpan: number;
}) {
  // Expansión 100% controlada por el padre (expandedId/onRecordClick), igual
  // que en la vista "list": sin estado local propio para no desincronizarse
  // de dos fuentes de verdad (chevron vs. click de fila).
  const expanded = isExpanded;

  return (
    <>
      <tr
        className={cn(
          "group transition-colors",
          onRecordClick && "cursor-pointer",
          isSelected ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-muted/40",
          expanded && "bg-muted/30"
        )}
        onClick={onRecordClick}
      >
        {onToggleSelect && (
          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} aria-label="Seleccionar fila" />
          </td>
        )}
        {showRhythm && (
          <td className="px-1 py-2">
            <RhythmMarker rhythm={rhythm} index={index} />
          </td>
        )}
        {columns.map((field) => (
          <td key={field.key} className={cn("px-3 py-2 align-middle max-w-[280px] truncate", columnClass(field))}>
            {renderField(field, item[field.key as keyof T], item, index)}
          </td>
        ))}
        {actions.length > 0 && (
          <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
            <RecordActions actions={actions} item={item} />
          </td>
        )}
        {hasExpand && (
          <td className="px-2 py-2 text-right">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRecordClick?.(); }}
              disabled={!onRecordClick}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer disabled:cursor-default disabled:opacity-30"
              aria-label={expanded ? "Contraer" : "Expandir"}
            >
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
            </button>
          </td>
        )}
      </tr>
      {expanded && (renderExpanded || collapsible.length > 0) && (
        <tr className="bg-muted/20">
          <td colSpan={colSpan} className="px-4 py-3 border-t border-border/40">
            {renderExpanded ? (
              renderExpanded(item)
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {collapsible.map((field) => (
                  <div key={field.key} className="flex items-baseline gap-2 text-xs">
                    {field.label && (
                      <span className="font-medium text-muted-foreground uppercase tracking-wide text-[10px] shrink-0">
                        {field.label}
                      </span>
                    )}
                    <span className="text-foreground/90 min-w-0 truncate">
                      {renderField(field, item[field.key as keyof T], item, index)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Skeleton de carga
// ─────────────────────────────────────────────────────────────────
export function TableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/20 px-4 py-2.5">
        <div className="h-3 w-full max-w-md rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                style={{ width: c === 0 ? "22%" : `${100 / columns / 1.5}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

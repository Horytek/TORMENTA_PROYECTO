import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FieldDef, RecordAction, RhythmConfig, ViewMode } from "./types";
import { sortFieldsByPriority, splitCollapsible } from "./types";
import { renderField } from "./fieldRenderers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Paleta de ritmos — colores funcionales, nunca decorativos
// ─────────────────────────────────────────────────────────────────
const RHYTHM_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/20",   fg: "bg-blue-400 dark:bg-blue-500",   border: "border-blue-200/60 dark:border-blue-700/40" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/20",fg: "bg-violet-400 dark:bg-violet-500",border: "border-violet-200/60 dark:border-violet-700/40" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-950/20",   fg: "bg-cyan-400 dark:bg-cyan-500",   border: "border-cyan-200/60 dark:border-cyan-700/40" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/20",fg:"bg-emerald-400 dark:bg-emerald-500",border:"border-emerald-200/60 dark:border-emerald-700/40" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/20",  fg: "bg-amber-400 dark:bg-amber-500",  border: "border-amber-200/60 dark:border-amber-700/40" },
  rose:    { bg: "bg-rose-50 dark:bg-rose-950/20",   fg: "bg-rose-400 dark:bg-rose-500",   border: "border-rose-200/60 dark:border-rose-700/40" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-950/20",fg: "bg-indigo-400 dark:bg-indigo-500",border: "border-indigo-200/60 dark:border-indigo-700/40" },
  teal:    { bg: "bg-teal-50 dark:bg-teal-950/20",   fg: "bg-teal-400 dark:bg-teal-500",   border: "border-teal-200/60 dark:border-teal-700/40" },
  zinc:    { bg: "bg-zinc-50 dark:bg-zinc-900",       fg: "bg-zinc-300 dark:bg-zinc-600",   border: "border-zinc-200/60 dark:border-zinc-700/40" },
  transparent: { bg: "bg-transparent", fg: "bg-zinc-200 dark:bg-zinc-700", border: "border-transparent" },
};

function getRhythmColors(color?: string) {
  if (!color) return RHYTHM_COLORS.transparent;
  return RHYTHM_COLORS[color] ?? RHYTHM_COLORS.blue;
}

// ─────────────────────────────────────────────────────────────────
// Ritmo visual — barra lateral, índice o punto
// ─────────────────────────────────────────────────────────────────
export function RhythmMarker({ rhythm, index }: { rhythm?: RhythmConfig; index: number }) {
  if (!rhythm) {
    // Índice genérico cuando no hay ritmo configurado
    return (
      <div className="flex flex-col items-center gap-0.5 w-6 shrink-0 select-none">
        <span className="text-[10px] text-muted-foreground/30 font-mono tabular-nums leading-none">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="w-px flex-1 min-h-4 bg-gradient-to-b from-transparent via-border to-transparent opacity-40" />
      </div>
    );
  }

  const colors = getRhythmColors(rhythm.color);

  if (rhythm.type === "accent") {
    return (
      <div className="flex items-start w-7 shrink-0">
        <div className={cn(
          "w-1 min-h-full rounded-full transition-all duration-300 group-hover:shadow-sm",
          colors.fg, "opacity-60 group-hover:opacity-100"
        )} />
      </div>
    );
  }

  if (rhythm.type === "index") {
    return (
      <div className="flex flex-col items-center gap-0.5 w-6 shrink-0 select-none">
        <span className={cn(
          "text-[10px] font-mono tabular-nums leading-none px-1 py-0.5 rounded",
          colors.bg, colors.fg.replace("bg-", "text-")
        )}>
          {String(rhythm.index ?? index + 1).padStart(2, "0")}
        </span>
        <div className="w-px flex-1 min-h-4 bg-gradient-to-b from-transparent via-border to-transparent opacity-40" />
      </div>
    );
  }

  if (rhythm.type === "progress") {
    const pct = rhythm.progress ?? 0;
    return (
      <div className="flex items-center gap-1 w-10 shrink-0">
        <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", colors.fg)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // dot
  return (
    <div className="flex items-center w-6 shrink-0">
      <div className={cn("h-2 w-2 rounded-full transition-all duration-300", colors.fg, "opacity-70 group-hover:opacity-100")} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Acciones — menú contextual de tres puntos e inline persistentes
// ─────────────────────────────────────────────────────────────────
export function RecordActions({
  actions,
  item,
}: {
  actions: RecordAction[];
  item: unknown;
}) {
  const visible = actions.filter(a => !a.hidden || !a.hidden(item));
  const persistent = visible.filter(a => a.persistent);
  const menuActions = visible.filter(a => !a.persistent);

  const isActionDisabled = (a: RecordAction) => {
    if (typeof a.disabled === "function") return a.disabled(item);
    return !!a.disabled;
  };

  const destructive = menuActions.filter(a => a.variant === "destructive");
  const normal = menuActions.filter(a => a.variant !== "destructive");

  return (
    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
      {persistent.map(a => (
        <Button
          key={a.id}
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs font-medium gap-1.5 hover:border-primary/50 cursor-pointer"
          onClick={() => a.onClick(item)}
          disabled={isActionDisabled(a)}
        >
          {a.icon && <span className="h-3.5 w-3.5 shrink-0">{a.icon}</span>}
          {a.label}
        </Button>
      ))}

      {menuActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-60 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-150 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Acciones del registro"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {normal.map(action => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => action.onClick(item)}
                disabled={isActionDisabled(action)}
                title={isActionDisabled(action) ? action.disabledReason : undefined}
                className="gap-2 cursor-pointer"
              >
                {action.icon && <span className="h-4 w-4 shrink-0">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            ))}
            {destructive.length > 0 && normal.length > 0 && <DropdownMenuSeparator />}
            {destructive.map(action => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => action.onClick(item)}
                disabled={isActionDisabled(action)}
                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
              >
                {action.icon && <span className="h-4 w-4 shrink-0">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Skeleton de carga
// ─────────────────────────────────────────────────────────────────
function RecordSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0">
      {/* Ritmo */}
      <div className="w-6 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
      {/* Campos */}
      <div className="flex-1 flex gap-4">
        <div className="h-4 w-32 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-20 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
      {/* Acciones */}
      <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse opacity-0 group-hover:opacity-100" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tipos de layout por vista
// ─────────────────────────────────────────────────────────────────
const LAYOUT_CONFIG: Record<ViewMode, {
  primaryCol: string;
  secondaryRow: boolean;
  showMeta: boolean;
  showCollapsible: boolean;
}> = {
  compact: {
    primaryCol: "flex-1 min-w-0",
    secondaryRow: false,
    showMeta: false,
    showCollapsible: false,
  },
  comfortable: {
    primaryCol: "flex-1 min-w-0",
    secondaryRow: true,
    showMeta: true,
    showCollapsible: false,
  },
  expanded: {
    primaryCol: "flex-1 min-w-0",
    secondaryRow: true,
    showMeta: true,
    showCollapsible: true,
  },
};

// ─────────────────────────────────────────────────────────────────
// Componente principal: AdaptiveRecord
// ─────────────────────────────────────────────────────────────────
interface AdaptiveRecordProps<T> {
  item: T;
  index: number;
  fields: FieldDef<T>[];
  actions?: RecordAction[];
  rhythm?: RhythmConfig;
  viewMode?: ViewMode;
  isSelected?: boolean;
  isExpanded?: boolean;
  onSelect?: (id: string | number) => void;
  onRecordClick?: (item: T) => void;
  getItemId: (item: T) => string | number;
}

export function AdaptiveRecord<T extends Record<string, unknown>>({
  item,
  index,
  fields,
  actions = [],
  rhythm,
  viewMode = "comfortable",
  isSelected = false,
  isExpanded = false,
  onSelect,
  onRecordClick,
  getItemId,
}: AdaptiveRecordProps<T>) {
  const [isHovered, setIsHovered] = useState(false);
  void isHovered; // intentionally unused — class applied via group CSS
  const id = getItemId(item);
  const layout = LAYOUT_CONFIG[viewMode];

  const sorted = sortFieldsByPriority(fields);
  const { visible, collapsible } = splitCollapsible(sorted);

  const primary = visible.filter(f => f.priority === "primary");
  const secondary = visible.filter(f => f.priority === "secondary");

  const primaryField = primary[0] || sorted[0];

  // Subtitle field: secondary field with semantic "subtitle"
  const subtitleField = secondary.find(f => f.semantic === "subtitle");
  const subtitleRawVal = subtitleField ? item[subtitleField.key as keyof T] : null;
  const hasSubtitleVal = subtitleRawVal !== null && subtitleRawVal !== undefined && String(subtitleRawVal).trim() !== "" && String(subtitleRawVal).trim() !== "—";

  // Col 6-7: Secondary Detail Chips / Text (excluding badges, status, numbers, codes)
  const detailChips = secondary.filter(f =>
    (f.semantic === "chip" || f.semantic === "text" || f.semantic === "icon-text") &&
    f.key !== primaryField?.key &&
    f.key !== subtitleField?.key
  );
  const hasDetail = detailChips.length > 0;

  // Col 8-9: Code / Unit / Barcode
  const codeFields = visible.filter(f =>
    f.semantic === "barcode" || f.semantic === "code" || f.key === "cod_barras" || f.key === "undm" || f.key.startsWith("id_")
  );
  const primaryCode = codeFields[0];

  // Col 10-11: Price / Number AND Badges / Status (Excluding any field key already used in Col 6-7 or Col 8-9!)
  const numberFields = secondary.filter(f => f.semantic === "number" && f.key !== primaryCode?.key);
  const statusBadgeFields = secondary.filter(f =>
    (f.semantic === "badge" || f.semantic === "status-dot" || f.key.includes("estado")) &&
    f.key !== primaryCode?.key &&
    !detailChips.some(d => d.key === f.key)
  );

  return (
    <div
      className={cn(
        "group relative flex items-stretch gap-0 border-b border-border/40 last:border-0",
        "transition-all duration-150 cursor-pointer",
        "hover:bg-accent/40 dark:hover:bg-accent/20",
        isSelected && "bg-primary/10 dark:bg-primary/20 border-primary/30",
        isExpanded && "bg-muted/60 dark:bg-muted/40 border-border/60",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onRecordClick?.(item)}
      style={{ paddingLeft: "0.5rem" }}
    >
      {/* ── Ritmo visual ── */}
      <div className="pt-3 pb-3 shrink-0 flex items-center pr-2">
        <RhythmMarker rhythm={rhythm} index={index} />
      </div>

      {/* ── Contenido principal ── */}
      <div className={cn("flex-1 py-3 pr-4 min-w-0", layout.primaryCol)}>
        {viewMode === "compact" ? (
          /* Compact View */
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="font-semibold text-foreground text-xs truncate">
                {renderField(primary[0] || sorted[0], item[(primary[0] || sorted[0])?.key as keyof T], item, index)}
              </span>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                {secondary.filter(f => f.semantic !== "subtitle").slice(0, 3).map((f) => (
                  <span key={f.key} className="border-l border-border/60 pl-2">
                    {renderField(f, item[f.key as keyof T], item, index)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onSelect && (
                <button
                  className={cn(
                    "h-4 w-4 rounded border transition-all flex items-center justify-center hover:border-primary cursor-pointer",
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border opacity-0 group-hover:opacity-100"
                  )}
                  onClick={e => { e.stopPropagation(); onSelect(id); }}
                >
                  {isSelected && <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
              )}
              {actions.length > 0 && <RecordActions actions={actions} item={item} />}
            </div>
          </div>
        ) : (
          /* Comfortable & Expanded Views: Dynamic 12-Column Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Col 1-5 (or Col 1-6 if no detail): Title + Subtitle */}
            <div className={cn("min-w-0 flex flex-col justify-center pr-2", hasDetail ? "md:col-span-5" : "md:col-span-6")}>
              <div className="font-semibold text-foreground text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                {renderField(primaryField, item[primaryField?.key as keyof T], item, index)}
              </div>
              {subtitleField && hasSubtitleVal && (
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground truncate">
                  {renderField(subtitleField, subtitleRawVal, item, index)}
                </div>
              )}
            </div>

            {/* Col 6-7: Brand / Category Chips / Detail Fields (Only if detail exists) */}
            {hasDetail && (
              <div className="md:col-span-2 flex flex-wrap gap-1.5 items-center">
                {detailChips.map(f => (
                  <div key={f.key}>
                    {renderField(f, item[f.key as keyof T], item, index)}
                  </div>
                ))}
              </div>
            )}

            {/* Col 8-9 (or Col 7-9 if no detail): Barcode / Unit / ID Code */}
            <div className={cn("flex items-center justify-start md:justify-center overflow-visible py-0.5", hasDetail ? "md:col-span-2" : "md:col-span-3")}>
              {primaryCode && (
                <div className="w-full flex justify-start md:justify-center overflow-visible">
                  {renderField(primaryCode, item[primaryCode.key as keyof T], item, index)}
                </div>
              )}
            </div>

            {/* Col 10-11: Price + Status Badge */}
            <div className="md:col-span-2 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1">
              {numberFields.map(f => (
                <div key={f.key} className="text-sm font-bold text-foreground tracking-tight">
                  {renderField(f, item[f.key as keyof T], item, index)}
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                {statusBadgeFields.map(f => (
                  <div key={f.key}>
                    {renderField(f, item[f.key as keyof T], item, index)}
                  </div>
                ))}
              </div>
            </div>

            {/* Col 12: Actions */}
            <div className="md:col-span-1 flex items-center justify-end gap-1 shrink-0">
              {onSelect && (
                <button
                  className={cn(
                    "h-5 w-5 rounded border-2 transition-all duration-150 flex items-center justify-center",
                    "hover:border-primary cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border opacity-0 group-hover:opacity-100",
                  )}
                  onClick={e => { e.stopPropagation(); onSelect(id); }}
                  aria-label="Seleccionar"
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )}
              {actions.length > 0 && <RecordActions actions={actions} item={item} />}
              {collapsible.length > 0 && (
                <span className={cn(
                  "h-5 w-5 flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer text-muted-foreground",
                  isExpanded && "rotate-90"
                )}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        )}

        {layout.showCollapsible && isExpanded && collapsible.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
            {collapsible.map((field) => (
              <div key={field.key} className="flex items-start gap-3">
                {field.label && (
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5 w-24 shrink-0">
                    {field.label}
                  </span>
                )}
                <span className="text-xs text-foreground flex-1">
                  {renderField(field, item[field.key as keyof T], item, index)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { RecordSkeleton };

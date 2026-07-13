import { cn } from "@/lib/utils";
import { Info, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ----------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------

export interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

export interface ColumnDef<T> {
  labelKey: keyof T;
  header?: string;
}

interface EntityCardsGridProps<T> {
  items: T[];
  getItemId?: (item: T) => string | number;
  columns: ColumnDef<T>[];
  subtitleKey?: keyof T;
  /** Retorna el tono de color para el nodo (default: azul) */
  nodeTint?: string | ((item: T) => string | undefined | null);
  extraColumns?: ColumnDef<T>[];
  getActions?: (item: T) => Action[];
  isLoading?: boolean;
  searchTerm?: string;
  emptyMessage?: {
    title: string;
    description: string;
  };
}

// ----------------------------------------------------------------
// Constantes de diseño
// ----------------------------------------------------------------

/** Tonos para el nodo cromático — paleta armónica editorial */
const NODE_TINTS = [
  { bg: "bg-blue-50 dark:bg-blue-950/20",   border: "border-blue-200/50 dark:border-blue-800/30",   dot: "bg-blue-400 dark:bg-blue-500",   line: "bg-blue-300 dark:bg-blue-600",   text: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-200/50 dark:border-violet-800/30", dot: "bg-violet-400 dark:bg-violet-500", line: "bg-violet-300 dark:bg-violet-600", text: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/20",   border: "border-cyan-200/50 dark:border-cyan-800/30",   dot: "bg-cyan-400 dark:bg-cyan-500",   line: "bg-cyan-300 dark:bg-cyan-600",   text: "text-cyan-600 dark:text-cyan-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/20",border: "border-emerald-200/50 dark:border-emerald-800/30",dot: "bg-emerald-400 dark:bg-emerald-500",line: "bg-emerald-300 dark:bg-emerald-600",text: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-amber-50 dark:bg-amber-950/20",  border: "border-amber-200/50 dark:border-amber-800/30",  dot: "bg-amber-400 dark:bg-amber-500",  line: "bg-amber-300 dark:bg-amber-600",  text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/20",  border: "border-rose-200/50 dark:border-rose-800/30",   dot: "bg-rose-400 dark:bg-rose-500",   line: "bg-rose-300 dark:bg-rose-600",   text: "text-rose-600 dark:text-rose-400" },
  { bg: "bg-indigo-50 dark:bg-indigo-950/20",border: "border-indigo-200/50 dark:border-indigo-800/30",  dot: "bg-indigo-400 dark:bg-indigo-500",  line: "bg-indigo-300 dark:bg-indigo-600",  text: "text-indigo-600 dark:text-indigo-400" },
  { bg: "bg-teal-50 dark:bg-teal-950/20",   border: "border-teal-200/50 dark:border-teal-800/30",   dot: "bg-teal-400 dark:bg-teal-500",   line: "bg-teal-300 dark:bg-teal-600",   text: "text-teal-600 dark:text-teal-400" },
];

function getTint(index: number, nodeTint?: string | ((item: unknown) => string), item?: unknown) {
  if (typeof nodeTint === "function") {
    const name = nodeTint(item ?? {});
    const found = NODE_TINTS.find(t => t.dot.includes(name.split("-")[1] ?? ""));
    return found ?? NODE_TINTS[index % NODE_TINTS.length];
  }
  if (typeof nodeTint === "string") {
    const found = NODE_TINTS.find(t => nodeTint.includes(t.dot.split("-")[1]));
    return found ?? NODE_TINTS[index % NODE_TINTS.length];
  }
  return NODE_TINTS[index % NODE_TINTS.length];
}

function getItemKey(item: unknown, index: number, getItemId?: (item: unknown) => string | number): string {
  if (getItemId) return String(getItemId(item));
  const id = (item as Record<string, unknown>)?.id;
  return id !== undefined ? String(id) : String(index);
}

// ----------------------------------------------------------------
// Skeleton — pulsación elegante sin forma
// ----------------------------------------------------------------
function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="group relative flex items-center gap-4 rounded-2xl border border-border/30 bg-card px-4 py-3"
        >
          {/* Node skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-px animate-pulse bg-muted" />
          </div>
          {/* Text skeleton */}
          <div className="min-w-0 flex-1 space-y-1.5 py-1">
            <div className="h-3.5 w-2/3 animate-pulse rounded-md bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded-md bg-muted" />
          </div>
          {/* Actions skeleton */}
          <div className="h-6 w-6 animate-pulse rounded-md bg-muted opacity-0 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Empty State — minimalista editorial
// ----------------------------------------------------------------
function EmptyState({
  searchTerm,
  emptyMessage,
}: {
  searchTerm?: string;
  emptyMessage?: { title: string; description: string };
}) {
  const title = emptyMessage?.title ?? "Sin resultados";
  const description =
    emptyMessage?.description ??
    (searchTerm
      ? `Ninguna coincidencia para "${searchTerm}"`
      : "No hay datos registrados todavía.");

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/50 py-20 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
        <Info className="h-5 w-5 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-medium text-foreground/70">{title}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground/50">{description}</p>
    </div>
  );
}

// ----------------------------------------------------------------
// ContextMenu — menú contextual minimalista
// ----------------------------------------------------------------
function ContextMenu({
  actions,
}: {
  actions: Action[];
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const visibleActions = actions.filter(a => !a.disabled);

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          "text-muted-foreground/40 transition-all duration-150",
          "hover:text-muted-foreground hover:bg-muted/60",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
        aria-label="Abrir opciones"
      >
        <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5 w-36",
            "rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm",
            "shadow-sm shadow-black/5",
            "origin-top-right animate-in fade-in-0 zoom-in-95 duration-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col py-1">
            {visibleActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-left",
                  "text-xs font-medium transition-colors duration-100",
                  "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                  action.variant === "destructive"
                    ? "text-destructive/80 hover:text-destructive"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {action.icon && <span className="h-3.5 w-3.5">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Helper to capitalize first letter and lowercase rest
// ----------------------------------------------------------------
function formatTitleCase(str: string): string {
  if (!str) return "";
  const val = str.trim();
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
}

// ----------------------------------------------------------------
// Golden ratio dynamic color helpers
// ----------------------------------------------------------------
function getColorIndex(val: unknown, fallbackIndex: number): number {
  if (val === undefined || val === null || val === "") return fallbackIndex;
  const num = Number(val);
  if (!isNaN(num)) return num;

  // Simple string hash
  const str = String(val);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ----------------------------------------------------------------
// EntityCard — ficha visual editorial
// ----------------------------------------------------------------
function EntityCard<T>(props: {
  item: T;
  columns: ColumnDef<T>[];
  subtitleKey?: keyof T;
  nodeTint?: string | ((item: T) => string | undefined | null);
  extraColumns?: ColumnDef<T>[];
  getActions?: (item: T) => Action[];
  index: number;
  getItemId?: (item: T) => string | number;
}) {
  const { item, columns, subtitleKey, nodeTint, extraColumns, getActions, index, getItemId } = props;

  const primaryCol = columns[0];
  const rawPrimaryValue = String(item[primaryCol.labelKey] ?? "");
  const primaryValue = formatTitleCase(rawPrimaryValue);
  const subtitleValue = subtitleKey ? String(item[subtitleKey] ?? "") : undefined;

  const tintKey = typeof nodeTint === "function" ? nodeTint(item) : nodeTint;
  const useGoldenRatio = !tintKey;

  let tint: { bg?: string; border?: string; dot?: string; line?: string; text?: string } = {};
  let inlineStyles: React.CSSProperties = {};

  if (useGoldenRatio) {
    const idVal = getItemId ? getItemId(item) : (item as any)?.id;
    const colorIdx = getColorIndex(idVal, index);
    const hue = (colorIdx * 137.508) % 360;
    inlineStyles = {
      "--node-hue": `${hue}`,
    } as React.CSSProperties;
  } else {
    tint = getTint(index, tintKey);
  }

  const actions = getActions?.(item);

  return (
    <div
      className={cn(
        "group relative flex items-stretch gap-0",
        "rounded-2xl border border-border/40 bg-card",
        "transition-all duration-200 hover:z-20 focus-within:z-20",
        "hover:border-border/70 hover:bg-card/80",
        "hover:shadow-sm hover:shadow-black/3",
        "cursor-default select-none"
      )}
      style={useGoldenRatio ? inlineStyles : undefined}
    >
      {/* ── Nodo cromático — círculo + línea de acento ── */}
      <div
        className={cn(
          "flex shrink-0 items-center pl-4 pr-3 border-r rounded-l-2xl",
          useGoldenRatio ? "golden-node-tint" : cn(tint.bg, tint.border)
        )}
      >
        {/* Círculo cromático */}
        <div
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            "transition-transform duration-200 group-hover:scale-110"
          )}
        >
          <div
            className={cn("h-2 w-2 rounded-full", !useGoldenRatio && tint.dot)}
            style={useGoldenRatio ? { backgroundColor: "hsl(var(--node-hue), 75%, 55%)" } : undefined}
          />
          {/* Halo muy sutil */}
          <div
            className={cn("absolute inset-0 rounded-full opacity-0 group-hover:opacity-30", !useGoldenRatio && tint.dot)}
            style={useGoldenRatio ? { backgroundColor: "hsl(var(--node-hue), 75%, 55%)" } : undefined}
          />
        </div>

        {/* Línea de acento — se extiende en hover */}
        <div
          className={cn(
            "ml-3 h-px w-4 transition-all duration-300 group-hover:w-8",
            !useGoldenRatio && tint.line, "opacity-50 group-hover:opacity-80"
          )}
          style={useGoldenRatio ? { backgroundColor: "hsl(var(--node-hue), 70%, 70%)" } : undefined}
        />
      </div>

      {/* ── Contenido principal — nombre + meta ── */}
      <div className="min-w-0 flex-1 truncate px-4 py-3.5">
        {/* Nombre como protagonista */}
        <p className="truncate text-sm font-medium tracking-tight text-foreground/90">
          {primaryValue || <span className="text-muted-foreground/40 italic">Sin nombre</span>}
        </p>

        {/* Subtitle / badge de categoría padre */}
        {subtitleValue && (
          <p className={cn("mt-0.5 truncate text-xs font-medium", useGoldenRatio ? "golden-node-text" : tint.text)}>
            {subtitleValue}
          </p>
        )}

        {/* Extra columns */}
        {extraColumns && extraColumns.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
            {extraColumns.slice(0, 3).map((col) => {
              const val = item[col.labelKey];
              if (val === undefined || val === null) return null;
              return (
                <span key={String(col.labelKey)} className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground/40">{col.header ?? String(col.labelKey)}</span>
                  <span className="text-xs font-medium text-muted-foreground/70">{String(val)}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Número decorativo de bajo contraste ── */}
      <div className="hidden sm:flex sm:items-start sm:justify-end sm:pr-3 sm:pt-3.5">
        <span
          className={cn(
            "font-mono text-[10px] font-medium tracking-widest",
            "text-muted-foreground/20 transition-colors duration-200",
            "group-hover:text-muted-foreground/35"
          )}
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* ── Menú contextual — aparece en hover ── */}
      <div
        className={cn(
          "flex items-center gap-1 pr-3 pl-2",
          "opacity-0 transition-opacity duration-150 focus-within:opacity-100",
          "group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {actions && actions.length > 0 ? (
          <ContextMenu actions={actions} />
        ) : (
          <div className="h-7 w-7" />
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------
export default function EntityCardsGrid<T>(props: EntityCardsGridProps<T>) {
  const { items, columns, subtitleKey, nodeTint, extraColumns, getActions, getItemId, isLoading, searchTerm, emptyMessage } = props;

  if (isLoading) return <CardsSkeleton count={6} />;

  if (items.length === 0) {
    return <EmptyState searchTerm={searchTerm} emptyMessage={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <EntityCard
          key={getItemKey(item, index, getItemId as ((item: unknown) => string | number) | undefined)}
          item={item}
          columns={columns}
          subtitleKey={subtitleKey}
          nodeTint={nodeTint}
          extraColumns={extraColumns}
          getActions={getActions}
          index={index}
          getItemId={getItemId}
        />
      ))}
    </div>
  );
}

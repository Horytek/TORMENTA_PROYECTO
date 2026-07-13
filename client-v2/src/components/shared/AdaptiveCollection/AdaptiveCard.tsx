import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { FieldDef, RecordAction, RhythmConfig } from "./types";
import { sortFieldsByPriority } from "./types";
import { renderField } from "./fieldRenderers";
import { MoreHorizontal } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Paleta de tintes — editorial, nunca genérica
// ─────────────────────────────────────────────────────────────────
const NODE_TINTS = [
  { bg: "bg-blue-50 dark:bg-blue-950/20",    border: "border-blue-200/60 dark:border-blue-800/30",   dot: "bg-blue-400 dark:bg-blue-500",    line: "bg-blue-300 dark:bg-blue-600",    text: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-violet-50 dark:bg-violet-950/20",border: "border-violet-200/60 dark:border-violet-800/30",dot:"bg-violet-400 dark:bg-violet-500", line: "bg-violet-300 dark:bg-violet-600",text:"text-violet-600 dark:text-violet-400" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/20",    border: "border-cyan-200/60 dark:border-cyan-800/30",     dot: "bg-cyan-400 dark:bg-cyan-500",     line: "bg-cyan-300 dark:bg-cyan-600",     text: "text-cyan-600 dark:text-cyan-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/20",border:"border-emerald-200/60 dark:border-emerald-800/30",dot:"bg-emerald-400 dark:bg-emerald-500",line:"bg-emerald-300 dark:bg-emerald-600",text:"text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-amber-50 dark:bg-amber-950/20",   border: "border-amber-200/60 dark:border-amber-800/30",   dot: "bg-amber-400 dark:bg-amber-500",   line: "bg-amber-300 dark:bg-amber-600",   text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/20",    border: "border-rose-200/60 dark:border-rose-800/30",     dot: "bg-rose-400 dark:bg-rose-500",    line: "bg-rose-300 dark:bg-rose-600",    text: "text-rose-600 dark:text-rose-400" },
  { bg: "bg-indigo-50 dark:bg-indigo-950/20", border: "border-indigo-200/60 dark:border-indigo-800/30",dot:"bg-indigo-400 dark:bg-indigo-500", line: "bg-indigo-300 dark:bg-indigo-600",text:"text-indigo-600 dark:text-indigo-400" },
  { bg: "bg-teal-50 dark:bg-teal-950/20",    border: "border-teal-200/60 dark:border-teal-800/30",     dot: "bg-teal-400 dark:bg-teal-500",    line: "bg-teal-300 dark:bg-teal-600",    text: "text-teal-600 dark:text-teal-400" },
];

function getColorIndex(val: unknown, fallbackIndex: number): number {
  if (val === undefined || val === null || val === "") return fallbackIndex;
  const num = Number(val);
  if (!isNaN(num)) return num;
  const str = String(val);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTint(index: number, color?: string) {
  if (!color) return null;
  return NODE_TINTS.find(t => color.includes(t.dot.split("-")[1])) ?? NODE_TINTS[index % NODE_TINTS.length];
}

// ─────────────────────────────────────────────────────────────────
// Context Menu — minimalista, aparece en hover
// ─────────────────────────────────────────────────────────────────
function ContextMenu({ actions, item }: { actions: RecordAction[]; item: unknown }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const visible = actions.filter(a => !a.hidden || !a.hidden(item));

  const isActionDisabled = (a: RecordAction) => {
    if (typeof a.disabled === "function") return a.disabled(item);
    return !!a.disabled;
  };

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
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
            {visible.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick(item); setOpen(false); }}
                disabled={isActionDisabled(action)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-left",
                  "text-xs font-medium transition-colors duration-100",
                  "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                  "disabled:opacity-40 disabled:hover:bg-transparent disabled:text-muted-foreground/50",
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

// ─────────────────────────────────────────────────────────────────
// AdaptiveCard — ficha editorial modular
// ─────────────────────────────────────────────────────────────────
interface AdaptiveCardProps<T> {
  item: T;
  index: number;
  fields: FieldDef<T>[];
  actions?: RecordAction[];
  rhythm?: RhythmConfig;
  getItemId: (item: T) => string | number;
  accentPosition?: "left" | "top";
}

export function AdaptiveCard<T extends Record<string, unknown>>({
  item,
  index,
  fields,
  actions = [],
  rhythm,
  getItemId,
  accentPosition: forcedAccent,
}: AdaptiveCardProps<T>) {
  const [isHovered, setIsHovered] = useState(false);

  const idVal = getItemId(item);
  const idHash = getColorIndex(idVal, index);

  // Siempre usar acento lateral para máxima uniformidad de la grilla
  const useAccentTop = forcedAccent === "top";

  // Ignorar color "emerald" o "active" de rhythm para usar colores procedimentales áureos
  const tint = (rhythm?.color && rhythm.color !== "emerald" && rhythm.color !== "active")
    ? getTint(index, rhythm.color)
    : null;

  // Golden ratio para color procedural cuando no hay tint
  const hue = (idHash * 137.508) % 360;
  const hasProceduralColor = !tint;

  const sorted = sortFieldsByPriority(fields);
  const primary = sorted.filter(f => f.priority === "primary" || f.priority === undefined);
  const secondary = sorted.filter(f => f.priority === "secondary");
  const meta = sorted.filter(f => f.priority === "meta");

  const primaryField = primary[0] || sorted[0];
  const subtitleField = secondary.find(f => f.semantic === "subtitle" || String(f.key).includes("nom_subcat") || String(f.key).includes("categoria"));
  const chipFields = secondary.filter(f => f.semantic === "chip" || f.semantic === "badge");
  const statusField = secondary.find(f => f.semantic === "status-dot");
  const iconTextFields = secondary.filter(f => f.semantic === "icon-text");
  const textFields = secondary.filter(f => f.semantic === "text");
  const numberField = secondary.find(f => f.semantic === "number");
  const codeFields = meta.filter(f => f.semantic === "code");
  const barcodeField = meta.find(f => f.semantic === "barcode" || f.key === "cod_barras");

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border/40 bg-card",
        "transition-all duration-200 cursor-default select-none",
        "hover:border-border/70 hover:bg-card/80 hover:z-20 focus-within:z-20",
        "hover:shadow-sm hover:shadow-black/3 hover:-translate-y-px",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={hasProceduralColor ? { "--node-hue": `${hue}` } as React.CSSProperties : undefined}
    >
      {/* ── Borde superior decorativo (top-accent variant) ── */}
      {useAccentTop && (
        <div
          className={cn(
            "h-0.5 w-full rounded-t-2xl transition-all duration-300",
            tint ? tint.line : "bg-zinc-200 dark:bg-zinc-700",
            isHovered && "opacity-80"
          )}
          style={hasProceduralColor ? { backgroundColor: `hsl(${hue}, 70%, 70%)` } : undefined}
        />
      )}

      <div className={cn("flex items-stretch gap-0 flex-1", useAccentTop ? "flex-col" : "flex-row")}>

        {/* ── Panel lateral — nodo cromático + línea de acento ── */}
        {!useAccentTop && (
          <div
            className={cn(
              "flex shrink-0 items-start pl-4 pr-3 border-r rounded-l-2xl",
              tint ? cn(tint.bg, tint.border) : "golden-node-tint",
              isHovered && "bg-zinc-100/80 dark:bg-zinc-800/60"
            )}
          >
            {/* Wrapper to align dot and line horizontally and position it at the top */}
            <div className="flex items-center mt-3.5">
              {/* Círculo cromático */}
              <div
                className={cn(
                  "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  "transition-transform duration-200 group-hover:scale-110"
                )}
              >
                <div
                  className={cn("h-2 w-2 rounded-full", tint && tint.dot)}
                  style={hasProceduralColor ? { backgroundColor: "hsl(var(--node-hue), 75%, 55%)" } : undefined}
                />
                {/* Halo */}
                <div
                  className={cn("absolute inset-0 rounded-full opacity-0 group-hover:opacity-30", tint && tint.dot)}
                  style={hasProceduralColor ? { backgroundColor: "hsl(var(--node-hue), 75%, 55%)" } : undefined}
                />
              </div>

              {/* Línea de acento — se extiende en hover */}
              <div
                className={cn(
                  "ml-3 h-px w-4 transition-all duration-300 group-hover:w-8",
                  tint ? tint.line : "", "opacity-50 group-hover:opacity-80"
                )}
                style={hasProceduralColor ? { backgroundColor: `hsl(${hue}, 70%, 70%)` } : undefined}
              />
            </div>
          </div>
        )}

        {/* ── Contenido principal ── */}
        <div className={cn("min-w-0 flex-1 px-4 py-3.5 space-y-1.5", useAccentTop && "pt-3 pb-4 flex flex-col justify-between")}>

          {/* Bloque: título + subtítulo */}
          <div className="space-y-0.5">
            <p className="truncate text-sm font-medium tracking-tight text-foreground/90">
              {primaryField ? renderField(primaryField, item[primaryField.key as keyof T], item, index) : (
                <span className="text-muted-foreground/40 italic">Sin nombre</span>
              )}
            </p>

            {(() => {
              if (!subtitleField) return null;
              const raw = item[subtitleField.key as keyof T];
              if (raw == null || raw === '' || String(raw).trim() === '—') return null;
              return (
                <p className={cn("truncate text-xs font-medium", tint ? tint.text : "golden-node-text")}>
                  {renderField(subtitleField, raw, item, index)}
                </p>
              );
            })()}
          </div>

          {/* Chips — marca, categoría */}
          {chipFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chipFields.slice(0, 3).map(f => {
                const v = item[f.key as keyof T];
                if (v == null || v === '' || String(v).trim() === '—') return null;
                return <div key={f.key}>{renderField(f, v, item, index)}</div>;
              }).filter(Boolean)}
              {/* placeholder para no dejar gap si todos están vacíos pero el array no */}
            </div>
          )}

          {/* Número discreto — oculto si es 0/null */}
          {(() => {
            if (!numberField) return null;
            const raw = item[numberField.key as keyof T];
            const num = Number(raw);
            const isZero = !isNaN(num) && num === 0;
            const isEmpty = raw == null || raw === '' || isZero;
            if (isEmpty) return null;
            return (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                {numberField.label && <span className="text-muted-foreground/60">{numberField.label}:</span>}
                <span className="font-medium text-foreground/80">
                  {renderField(numberField, raw, item, index)}
                </span>
              </div>
            );
          })()}

          {/* Status dot — estado activo/inactivo */}
          {statusField && (
            <div>
              {renderField(statusField, item[statusField.key as keyof T], item, index)}
            </div>
          )}

          {/* Campos con icono (teléfono, email, vendedor) — render gestiona vacío */}
          {(() => {
            const visible = iconTextFields.filter(f => {
              if (f.render) return true;
              const v = item[f.key as keyof T];
              return v != null && v !== '' && String(v).trim() !== '' && String(v).trim() !== '—';
            });
            if (visible.length === 0) return null;
            return (
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {visible.slice(0, 3).map(f => (
                  <div key={f.key} className="min-w-0 truncate">
                    {renderField(f, item[f.key as keyof T], item, index)}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Campos de texto genéricos (dirección, etc.) — solo no vacíos */}
          {(() => {
            const visible = textFields.filter(f => {
              if (f.render) return true;
              const v = item[f.key as keyof T];
              return v != null && v !== '' && String(v).trim() !== '' && String(v).trim() !== '—';
            });
            if (visible.length === 0) return null;
            return (
              <div className="flex flex-col gap-0.5 pt-1 border-t border-border/30">
                {visible.slice(0, 2).map(f => (
                  <p key={f.key} className="truncate text-xs text-muted-foreground">
                    {renderField(f, item[f.key as keyof T], item, index)}
                  </p>
                ))}
              </div>
            );
          })()}

          {/* Metadatos en línea */}
          {(() => {
            const visible = codeFields.filter(f => {
              if (f.render) return true;
              const v = item[f.key as keyof T];
              return v != null && v !== '' && String(v).trim() !== '' && String(v).trim() !== '—';
            });
            if (visible.length === 0) return null;
            return (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                {visible.slice(0, 3).map(f => (
                  <span key={f.key} className="flex items-center gap-1">
                    {f.label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{f.label}</span>}
                    <span className="text-[10px] font-mono font-medium text-muted-foreground/70">{renderField(f, item[f.key as keyof T], item, index)}</span>
                  </span>
                ))}
              </div>
            );
          })()}

          {/* Código de barras dedicado */}
          {barcodeField && (
            <div className="mt-2.5 pt-2 border-t border-border/30 flex justify-center w-full">
              {renderField(barcodeField, item[barcodeField.key as keyof T], item, index)}
            </div>
          )}
        </div>

        {/* ── Columna derecha: índice + acciones ── */}
        <div className={cn(
          "flex flex-col items-end justify-between gap-2 py-3 pr-3 pl-2",
          useAccentTop && "flex-row items-center px-4 pb-3 pt-0"
        )}>
          {/* Índice decorativo vertical */}
          <span
            className={cn(
              "font-mono text-[10px] font-medium tracking-widest",
              "text-muted-foreground/20 transition-colors duration-200",
              "group-hover:text-muted-foreground/35",
              useAccentTop ? "order-2 text-[9px]" : "order-1"
            )}
            style={useAccentTop ? { writingMode: "horizontal-tb" } : { writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Menú contextual — aparece en hover */}
          <div className={cn(
            "order-1 flex items-center gap-1",
            "opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100"
          )}>
            {actions.length > 0 ? (
              <ContextMenu actions={actions} item={item} />
            ) : (
              <div className="h-7 w-7" />
            )}
          </div>
        </div>
      </div>

      {/* ── Barra inferior decorativa (top-accent variant) ── */}
      {useAccentTop && (
        <div
          className={cn(
            "h-px w-0 group-hover:w-full rounded-b-2xl transition-all duration-500 ease-out",
            tint ? tint.line : "bg-zinc-200 dark:bg-zinc-700",
          )}
          style={hasProceduralColor ? { backgroundColor: `hsl(${hue}, 70%, 70%)` } : undefined}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Skeleton — pulsación editorial sin forma
// ─────────────────────────────────────────────────────────────────
export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="group relative flex items-stretch rounded-2xl border border-border/30 bg-card px-4 py-3"
        >
          {/* Nodo skeleton */}
          <div className="flex items-center gap-3 pr-3 border-r border-border/30 rounded-l-2xl">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-px w-4 animate-pulse bg-muted" />
          </div>
          {/* Texto skeleton */}
          <div className="min-w-0 flex-1 space-y-1.5 px-4 py-3.5">
            <div className="h-3.5 w-2/3 animate-pulse rounded-md bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded-md bg-muted" />
          </div>
          {/* Acciones skeleton */}
          <div className="flex items-center pr-3 pl-2">
            <div className="h-7 w-7 animate-pulse rounded-lg bg-muted opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

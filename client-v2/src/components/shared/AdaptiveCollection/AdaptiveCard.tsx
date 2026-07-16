import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type {
  FieldDef, RecordAction, RhythmConfig,
  CardVariant, CardSlots, MediaSpec, ItemState,
} from "./types";
import { mapFieldsToSlots, deriveItemState } from "./FieldAutoMap.tsx";
import { Accent } from "./Accent";
import { cardRootVariants, NODE_TINTS } from "./variants";
import { KpiField } from "./fieldRenderers";
import { sortFieldsByPriority } from "./types";
import { MoreHorizontal } from "lucide-react";

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
// Props públicas — compatibles con la versión anterior + nuevas.
// ─────────────────────────────────────────────────────────────────
export interface AdaptiveCardProps<T> {
  item: T;
  index: number;
  fields: FieldDef<T>[];
  actions?: RecordAction[];
  rhythm?: RhythmConfig;
  getItemId: (item: T) => string | number;
  accentPosition?: "left" | "top";
  className?: string;
  /** Visual archetype. Default = "default" (idéntico al card original). */
  variant?: CardVariant;
  /** Composición explícita por slots — sobreescribe la auto-derivación. */
  slots?: Partial<CardSlots>;
  /** Estado semántico explícito — sobreescribe la deducción desde rhythm. */
  state?: ItemState;
  /** Tinte explícito (color o nombre de paleta) para el accent. */
  accentColor?: string;
  /** Callback para manejar clics sobre la tarjeta. */
  onClick?: () => void;
}

// ─────────────────────────────────────────────────────────────────
// AdaptiveCard — Phase 2 (con slots + variants, 100% backwards-compatible)
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdaptiveCard<T extends Record<string, any>>({
  item,
  index,
  fields,
  actions = [],
  rhythm,
  getItemId,
  accentPosition = "left",
  className,
  variant = "default",
  slots: explicitSlots,
  state: explicitState,
  accentColor,
  onClick,
}: AdaptiveCardProps<T>) {
  const [isHovered, setIsHovered] = useState(false);
  void isHovered; // hover se aplica vía group/adaptive-card

  // ── Estado semántico (para el accent) ───────────────────────────
  const itemState: ItemState =
    explicitState ??
    rhythm?.state ??
    deriveItemState(fields, item);

  const isProcedural = !accentColor && (itemState === "active" || itemState === "neutral" || itemState === "info");

  // ── Resolución del tinte (compatibilidad con card original) ──────
  const tintClasses = resolveTint(rhythm?.color);

  // ── Auto-map si no hay slots explícitos ──────────────────────────
  const autoMap = explicitSlots
    ? { nodes: [], slots: {} as Partial<CardSlots> }
    : mapFieldsToSlots(fields, item, index, {
        subtitleClass: isProcedural ? undefined : (tintClasses?.text ?? undefined),
      });

  const slots: Partial<CardSlots> = { ...autoMap.slots, ...explicitSlots };
  // `contentNodes` es la lista plana en orden vertical — fidelidad visual
  // máxima al card original (cada sección con su padding/border propios).
  const contentNodes: React.ReactNode[] = explicitSlots
    ? [
        slots.header,
        slots.body,
        slots.footer,
      ].filter(Boolean) as React.ReactNode[]
    : autoMap.nodes;

  // ── Resolución de props del accent ──────────────────────────────
  const accentKind: "solid" | "progress" =
    rhythm?.type === "progress" ? "progress" : "solid";
  const accentProgress = rhythm?.progress;

  // ── Render ──────────────────────────────────────────────────────
  // Por ahora solo implementamos el variant `default` y `media-cover`
  // (los demás son slots-only con mayor libertad compositiva).
  const rootClass = cardRootVariants({ variant });

  if (variant === "media-cover") {
    return (
      <div
        className={cn(rootClass, className, onClick && "cursor-pointer")}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Cover media (opcional) */}
        {slots.media && renderMedia(slots.media)}

        <div className="flex flex-col flex-1 px-4 pb-3.5 space-y-1.5">
          {slots.header}
          {slots.body}
          {slots.footer}
        </div>

        <CardAside
          index={index}
          actions={actions}
          item={item}
          variant="media-cover"
        />
      </div>
    );
  }

  if (variant === "split-row") {
    return (
      <div
        className={cn(rootClass, className, onClick && "cursor-pointer")}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {slots.media && (
          <div className="flex shrink-0 items-center pl-4">{renderMediaCompact(slots.media)}</div>
        )}
        <div className="min-w-0 flex-1 space-y-1 px-4 py-3">
          {slots.header}
          {slots.body}
        </div>
        {slots.footer && (
          <div className="hidden shrink-0 items-center px-3 text-right sm:flex">{slots.footer}</div>
        )}
        <CardAside index={index} actions={actions} item={item} variant="side" />
      </div>
    );
  }

  if (variant === "stat-tile") {
    const sortedFields = sortFieldsByPriority(fields);
    const kpiField = sortedFields.find(f => f.semantic === "kpi") ?? sortedFields.find(f => f.priority === "primary");
    const restFields = sortedFields.filter(f => f !== kpiField && f.priority !== "hidden");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyItem = item as any;
    const rawValue = kpiField ? anyItem[kpiField.key] : undefined;
    const formattedValue = kpiField?.format ? kpiField.format(rawValue, item) : rawValue;

    return (
      <div
        className={cn(rootClass, className, "p-4", onClick && "cursor-pointer")}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {kpiField?.label ?? "—"}
          </span>
          {actions.length > 0 && <ContextMenu actions={actions} item={item} />}
        </div>
        <div className="mt-2">
          <KpiField value={formattedValue} thresholds={kpiField?.thresholds} size="xl" />
        </div>
        {restFields.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-2.5">
            {restFields.slice(0, 3).map((f, i) => {
              const v = anyItem[f.key];
              if (v == null || v === "") return null;
              if (f.render) return <span key={i} className="text-xs">{f.render(v, item, index)}</span>;
              return (
                <span key={i} className="text-xs text-muted-foreground">
                  {f.label ? <span className="text-muted-foreground/60">{f.label}: </span> : null}
                  {String(f.format ? f.format(v, item) : v)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Variant `default` (idéntico al card original)
  return (
    <div
      className={cn(rootClass, className, onClick && "cursor-pointer")}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={
        isProcedural && accentKind === "solid"
          ? deriveHueStyle(getItemId(item))
          : undefined
      }
    >
      {/* ── Rail izquierdo — accent (top o left) ──────────────── */}
      <Accent
        kind={accentKind}
        state={itemState}
        tint={isProcedural ? undefined : (accentColor ?? rhythm?.color)}
        position={accentPosition}
        progress={accentProgress}
        className={isProcedural ? "golden-node-tint" : undefined}
      />

      {/* ── Contenido principal ──────────────────────────────── */}
      <div
        className={cn(
          "min-w-0 flex-1 px-4 py-3.5 space-y-1.5",
          accentPosition === "top" && "pt-3 pb-4 flex flex-col justify-between"
        )}
      >
        {contentNodes}
      </div>

      {/* ── Aside — índice + acciones ─────────────────────────── */}
      <CardAside
        index={index}
        actions={actions}
        item={item}
        variant={accentPosition === "top" ? "top" : "side"}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-componentes internos
// ─────────────────────────────────────────────────────────────────
function CardAside({
  index, actions, item, variant: v,
}: { index: number; actions: RecordAction[]; item: unknown; variant: "side" | "top" | "media-cover" }) {
  if (v === "media-cover") {
    return (
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
        {actions.length > 0 && <ContextMenu actions={actions} item={item} />}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-end justify-between gap-2 py-3 pr-3 pl-2",
      v === "top" && "flex-row items-center px-4 pb-3 pt-0"
    )}>
      {/* Índice decorativo (vertical) */}
      <span
        className={cn(
          "num font-mono text-[10px] font-medium tracking-widest",
          "text-muted-foreground/20 transition-colors duration-200",
          "group-hover/adaptive-card:text-muted-foreground/35",
          v === "top" ? "order-2 text-[9px]" : "order-1"
        )}
        style={v === "top" ? { writingMode: "horizontal-tb" } : { writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Menú contextual — aparece en hover */}
      <div className={cn(
        "order-1 flex items-center gap-1",
        "opacity-0 transition-opacity duration-150 group-hover/adaptive-card:opacity-100 focus-within:opacity-100"
      )}>
        {actions.length > 0 ? (
          <ContextMenu actions={actions} item={item} />
        ) : (
          <div className="h-7 w-7" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function renderMedia(media: MediaSpec | React.ReactNode): React.ReactNode {
  if (!media) return null;
  if (ReactNode_isElement(media)) return media;
  const m = media as MediaSpec;
  switch (m.kind) {
    case "image":
      return (
        <div className="relative w-full overflow-hidden rounded-t-2xl bg-muted aspect-[16/9]">
          <img src={m.src} alt={m.alt ?? ""} className="h-full w-full object-cover" />
        </div>
      );
    case "logo":
      return (
        <div className="flex w-full items-center justify-center bg-muted/40 py-6 rounded-t-2xl">
          <img src={m.src} alt={m.alt ?? ""} className="h-12 w-12 object-contain" />
        </div>
      );
    case "avatar":
      return (
        <div className="flex w-full items-center gap-3 bg-muted/40 px-4 py-4 rounded-t-2xl">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-sm font-semibold ring-2 ring-background">
            {getInitialsSafe(m.name)}
          </span>
          {m.sub && <span className="text-xs text-muted-foreground">{m.sub}</span>}
        </div>
      );
    case "icon":
      return (
        <div className="flex w-full items-center justify-center bg-muted/40 py-6 rounded-t-2xl">
          <span className="flex h-10 w-10 items-center justify-center text-muted-foreground">{m.node}</span>
        </div>
      );
    case "node":
      return <div className="w-full">{m.node}</div>;
  }
}

/** Versión compacta de `renderMedia` para variantes horizontales (split-row):
 * un círculo/cuadro de ~44px en vez del bloque "cover" a todo el ancho. */
function renderMediaCompact(media: MediaSpec | React.ReactNode): React.ReactNode {
  if (!media) return null;
  if (ReactNode_isElement(media)) return media;
  const m = media as MediaSpec;
  switch (m.kind) {
    case "avatar":
      return (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground/80 ring-1 ring-border/60">
          {m.src ? <img src={m.src} alt="" className="h-full w-full rounded-full object-cover" /> : getInitialsSafe(m.name)}
        </span>
      );
    case "image":
      return (
        <div className="h-11 w-11 overflow-hidden rounded-lg bg-muted">
          <img src={m.src} alt={m.alt ?? ""} className="h-full w-full object-cover" />
        </div>
      );
    case "logo":
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted/60 p-1.5">
          <img src={m.src} alt={m.alt ?? ""} className="h-full w-full object-contain" />
        </div>
      );
    case "icon":
      return (
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
          {m.node}
        </span>
      );
    case "node":
      return m.node;
  }
}

// Helpers sin React import para evitar circular
function ReactNode_isElement(node: unknown): node is React.ReactElement {
  return typeof node === "object" && node !== null && "type" in (node as object)
    && typeof (node as { type?: unknown }).type !== "undefined";
}

function getInitialsSafe(name: string | undefined | null): string {
  if (!name) return "—";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Resuelve el tinte "editorial" del card a partir del nombre de color
 * (e.g. "emerald", "rose"). Devuelve `{ bg, text, dot, line }` con
 * clases de Tailwind. `null` si no hay color.
 */
function resolveTint(color?: string): { bg?: string; text?: string; dot?: string; line?: string } | null {
  if (!color) return null;
  return NODE_TINTS.find(t => color.includes(t.id)) ?? null;
}

function deriveHueStyle(idVal: string | number): React.CSSProperties | undefined {
  // Solo se usa cuando no hay tinte explícito: golden ratio procedural original.
  const num = Number(idVal);
  let hash: number;
  if (!isNaN(num) && String(idVal).trim() !== "") hash = num;
  else {
    const s = String(idVal);
    hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
  }
  const hue = (Math.abs(hash) * 137.508) % 360;
  return { ["--node-hue" as string]: `${hue}` } as React.CSSProperties;
}

// ─────────────────────────────────────────────────────────────────
// Skeleton — pulsación editorial sin forma (mantiene el del card original)
// ─────────────────────────────────────────────────────────────────
export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="group/adaptive-card relative flex items-stretch rounded-2xl border border-border/30 bg-card px-4 py-3"
        >
          <div className="flex items-center gap-3 pr-3 border-r border-border/30 rounded-l-2xl">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-px w-4 animate-pulse bg-muted" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5 px-4 py-3.5">
            <div className="h-3.5 w-2/3 animate-pulse rounded-md bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="flex items-center pr-3 pl-2">
            <div className="h-7 w-7 animate-pulse rounded-lg bg-muted opacity-0 group-hover/adaptive-card:opacity-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

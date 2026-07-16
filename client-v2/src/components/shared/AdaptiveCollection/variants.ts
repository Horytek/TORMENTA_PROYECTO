import { cva, type VariantProps } from "class-variance-authority";

/**
 * Variants del card raíz — controlan la composición estructural.
 * Siguen el patrón de `button.tsx` y `badge.tsx` del proyecto.
 *
 * Importante: el `default` reproduce **idéntico** el layout del card
 * original para no romper las 4 páginas que ya lo consumen.
 */
export const cardRootVariants = cva(
  // base — geometría común
  [
    "group/adaptive-card relative flex flex-col rounded-2xl border bg-card",
    "transition-all duration-200 select-none",
    "hover:border-border/70 hover:bg-card/80 hover:z-20 focus-within:z-20",
    "hover:shadow-sm hover:shadow-black/3 hover:-translate-y-px",
  ],
  {
    variants: {
      variant: {
        default: "flex-row items-stretch gap-0",
        "media-cover": "flex-col",
        "split-row": "flex-row items-stretch gap-0",
        "dense-tile": "flex-row items-stretch gap-0 px-3 py-2.5",
        "stat-tile": "flex-col items-stretch",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type CardRootVariantProps = VariantProps<typeof cardRootVariants>;

/**
 * Variants del rail/acento lateral (Phase 2).
 * Sustituye el "nodo cromático" (dot + línea) del card original.
 */
export const accentVariants = cva(
  "flex shrink-0 items-start",
  {
    variants: {
      position: {
        left: "pl-3.5 pr-2.5 border-r rounded-l-2xl",
        top: "h-0.5 w-full rounded-t-2xl",
        none: "hidden",
      },
      style: {
        solid: "",
        gradient: "",
        progress: "",
        "rail-only": "w-1.5 pl-0 pr-0 border-r-0 justify-center",
      },
    },
    defaultVariants: {
      position: "left",
      style: "solid",
    },
  }
);

export type AccentVariantProps = VariantProps<typeof accentVariants>;

/**
 * Variants del KPI / cifra grande (semantic: "kpi").
 * Cambia el tamaño y color según `state`.
 */
export const kpiVariants = cva(
  "num inline-flex items-baseline gap-1 font-semibold tabular-nums leading-none",
  {
    variants: {
      state: {
        active: "text-foreground",
        inactive: "text-muted-foreground/60",
        warning: "text-amber-600 dark:text-amber-400",
        error: "text-destructive",
        info: "text-blue-600 dark:text-blue-400",
        neutral: "text-foreground",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-2xl",
        xl: "text-3xl",
      },
    },
    defaultVariants: {
      state: "neutral",
      size: "md",
    },
  }
);

export type KpiVariantProps = VariantProps<typeof kpiVariants>;

/**
 * Tokens de tinte (mapeo state → clases de Tailwind).
 * Sustituye al `NODE_TINTS` del card original pero basado en tokens semánticos.
 */
export const STATE_TINT: Record<
  "active" | "inactive" | "warning" | "error" | "info" | "neutral",
  { bg: string; text: string; dot: string; line: string; border: string }
> = {
  active:   { bg: "bg-emerald-50 dark:bg-emerald-950/20",  text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", line: "bg-emerald-400/70", border: "border-emerald-200/60 dark:border-emerald-800/30" },
  inactive: { bg: "bg-zinc-50 dark:bg-zinc-900/40",         text: "text-zinc-500 dark:text-zinc-400",       dot: "bg-zinc-400",       line: "bg-zinc-300/60",       border: "border-zinc-200/60 dark:border-zinc-700/30" },
  warning:  { bg: "bg-amber-50 dark:bg-amber-950/20",       text: "text-amber-700 dark:text-amber-400",      dot: "bg-amber-500",      line: "bg-amber-400/70",      border: "border-amber-200/60 dark:border-amber-800/30" },
  error:    { bg: "bg-rose-50 dark:bg-rose-950/20",         text: "text-rose-700 dark:text-rose-400",        dot: "bg-rose-500",        line: "bg-rose-400/70",        border: "border-rose-200/60 dark:border-rose-800/30" },
  info:     { bg: "bg-blue-50 dark:bg-blue-950/20",         text: "text-blue-700 dark:text-blue-400",        dot: "bg-blue-500",        line: "bg-blue-400/70",        border: "border-blue-200/60 dark:border-blue-800/30" },
  neutral:  { bg: "bg-muted/40",                            text: "text-muted-foreground",                    dot: "bg-muted-foreground/40", line: "bg-border",          border: "border-border/40" },
};

/**
 * Paleta de tintes "editoriales" — heredada del card original.
 * Se usa cuando se quiere un color por **identidad** (no por estado).
 */
export const NODE_TINTS = [
  { id: "blue",    bg: "bg-blue-50 dark:bg-blue-950/20",       border: "border-blue-200/60 dark:border-blue-800/30",   dot: "bg-blue-500",    line: "bg-blue-400/70",    text: "text-blue-700 dark:text-blue-400" },
  { id: "violet",  bg: "bg-violet-50 dark:bg-violet-950/20",   border: "border-violet-200/60 dark:border-violet-800/30", dot: "bg-violet-500",  line: "bg-violet-400/70",  text: "text-violet-700 dark:text-violet-400" },
  { id: "cyan",    bg: "bg-cyan-50 dark:bg-cyan-950/20",       border: "border-cyan-200/60 dark:border-cyan-800/30",   dot: "bg-cyan-500",    line: "bg-cyan-400/70",    text: "text-cyan-700 dark:text-cyan-400" },
  { id: "emerald", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200/60 dark:border-emerald-800/30", dot: "bg-emerald-500", line: "bg-emerald-400/70", text: "text-emerald-700 dark:text-emerald-400" },
  { id: "amber",   bg: "bg-amber-50 dark:bg-amber-950/20",     border: "border-amber-200/60 dark:border-amber-800/30", dot: "bg-amber-500",   line: "bg-amber-400/70",   text: "text-amber-700 dark:text-amber-400" },
  { id: "rose",    bg: "bg-rose-50 dark:bg-rose-950/20",       border: "border-rose-200/60 dark:border-rose-800/30",   dot: "bg-rose-500",    line: "bg-rose-400/70",    text: "text-rose-700 dark:text-rose-400" },
  { id: "indigo",  bg: "bg-indigo-50 dark:bg-indigo-950/20",   border: "border-indigo-200/60 dark:border-indigo-800/30", dot: "bg-indigo-500",  line: "bg-indigo-400/70",  text: "text-indigo-700 dark:text-indigo-400" },
  { id: "teal",    bg: "bg-teal-50 dark:bg-teal-950/20",       border: "border-teal-200/60 dark:border-teal-800/30",   dot: "bg-teal-500",    line: "bg-teal-400/70",    text: "text-teal-700 dark:text-teal-400" },
] as const;

export type NodeTintId = typeof NODE_TINTS[number]["id"];

export function getTintById(id: string | undefined | null): typeof NODE_TINTS[number] | null {
  if (!id) return null;
  return NODE_TINTS.find(t => id.includes(t.id)) ?? null;
}

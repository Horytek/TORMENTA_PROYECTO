import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FieldDef, ItemState } from "./types";
import { inferSemantic, inferState, getInitials } from "./types";
import { kpiVariants } from "./variants";
import Barcode from "@/components/ui/Barcode";

// Paleta semántica
const SEMANTIC_COLORS: Record<string, { bg: string; text: string; dot?: string }> = {
  active:   { bg: "bg-emerald-50 dark:bg-emerald-950/30",  text: "text-emerald-600 dark:text-emerald-400",  dot: "bg-emerald-500" },
  inactive: { bg: "bg-zinc-50 dark:bg-zinc-950/30",        text: "text-zinc-500 dark:text-zinc-400",        dot: "bg-zinc-400" },
  inactivo: { bg: "bg-zinc-50 dark:bg-zinc-950/30",        text: "text-zinc-500 dark:text-zinc-400",        dot: "bg-zinc-400" },
  warning:  { bg: "bg-amber-50 dark:bg-amber-950/30",       text: "text-amber-600 dark:text-amber-400",       dot: "bg-amber-500" },
  pendiente: { bg: "bg-amber-50 dark:bg-amber-950/30",     text: "text-amber-600 dark:text-amber-400",       dot: "bg-amber-500" },
  error:    { bg: "bg-rose-50 dark:bg-rose-950/30",        text: "text-rose-600 dark:text-rose-400",        dot: "bg-rose-500" },
  fallido:  { bg: "bg-rose-50 dark:bg-rose-950/30",        text: "text-rose-600 dark:text-rose-400",        dot: "bg-rose-500" },
  info:     { bg: "bg-blue-50 dark:bg-blue-950/30",         text: "text-blue-600 dark:text-blue-400",         dot: "bg-blue-500" },
  default:  { bg: "bg-zinc-50 dark:bg-zinc-900",           text: "text-zinc-600 dark:text-zinc-300",         dot: "bg-zinc-400" },
};

function getStatusColor(value: unknown): { bg: string; text: string; dot?: string } {
  const str = String(value ?? "").toLowerCase();
  if (str === "1" || str === "active" || str === "activo" || str === "activa" || str === "enabled" || str === "aprobado" || str === "completado" || str === "completed") return SEMANTIC_COLORS.active;
  if (str === "0" || str === "inactive" || str === "inactivo" || str === "inactiva" || str === "disabled" || str === "desactivado" || str === "deleted" || str === "eliminado") return SEMANTIC_COLORS.inactivo;
  if (str === "warning" || str === "pendiente" || str === "pending" || str === "en proceso") return SEMANTIC_COLORS.warning;
  if (str === "error" || str === "fallido" || str === "failed" || str === "rechazado") return SEMANTIC_COLORS.error;
  return SEMANTIC_COLORS.default;
}

// Formatores
function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCode(value: unknown): string {
  if (!value) return "—";
  return String(value).toUpperCase();
}

// Renderizadores por tipo semántico
function Title({ value, className }: { value: string; className?: string }) {
  return <span className={cn("text-sm font-medium text-foreground leading-tight line-clamp-1", className)}>{value || "—"}</span>;
}

function Subtitle({ value, className }: { value: string; className?: string }) {
  return <span className={cn("text-xs text-muted-foreground leading-tight line-clamp-1", className)}>{value || "—"}</span>;
}

function BadgeField({ value, className }: { value: string | number; className?: string }) {
  const colors = getStatusColor(value);
  const label = String(value).charAt(0).toUpperCase() + String(value).slice(1);
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium leading-none", colors.bg, colors.text, className)}>
      {colors.dot && <span className={cn("h-1 w-1 rounded-full", colors.dot)} />}
      {label}
    </span>
  );
}

function NumberField({ value, prefix, className }: { value: unknown; prefix?: string; className?: string }) {
  return (
    <span className={cn("num text-sm font-semibold tabular-nums text-foreground", className)}>
      {prefix && <span className="text-xs font-normal text-muted-foreground mr-0.5">{prefix}</span>}
      {formatNumber(value)}
    </span>
  );
}

function DateField({ value, className }: { value: unknown; className?: string }) {
  return <span className={cn("text-xs text-muted-foreground", className)}>{formatDate(value)}</span>;
}

function CodeField({ value, className }: { value: unknown; className?: string }) {
  return (
    <span className={cn("inline-flex px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 tracking-wide", className)}>
      {formatCode(value)}
    </span>
  );
}

function ChipField({ value, color, className }: { value: string; color?: string; className?: string }) {
  const colorClass = color
    ? `bg-${color}-50 dark:bg-${color}-950/30 text-${color}-600 dark:text-${color}-400`
    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium leading-none", colorClass, className)}>{value}</span>;
}

function IconTextField({ value, icon, className }: { value: unknown; icon?: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      {value != null && <span className="truncate">{String(value)}</span>}
    </span>
  );
}

function ProgressBar({ value, className }: { value: unknown; className?: string }) {
  const num = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-blue-400 dark:bg-blue-500 transition-all" style={{ width: `${num}%` }} />
      </div>
      <span className="num text-[10px] tabular-nums text-muted-foreground w-8 text-right">{num}%</span>
    </div>
  );
}

function StatusDot({ value, className }: { value: string; className?: string }) {
  const colors = getStatusColor(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot ?? "bg-zinc-400")} />
      <span className={cn("text-xs", colors.text)}>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span>
    </span>
  );
}

function BarcodeField({ value, className }: { value: unknown; className?: string }) {
  const str = String(value ?? "");
  if (!str || str === "—" || str === "-") return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className={cn("inline-flex max-w-[120px] justify-center py-0.5", className)}>
      <Barcode
        value={str}
        className="bg-transparent max-h-[22px]"
        options={{ width: 0.8, height: 16, fontSize: 8, displayValue: true }}
      />
    </div>
  );
}

function TextField({ value, className }: { value: unknown; className?: string }) {
  return <span className={cn("text-xs text-muted-foreground line-clamp-1", className)}>{value != null ? String(value) : "—"}</span>;
}

// ─────────────────────────────────────────────────────────────────
// Nuevos renderers (Phase 2)
// ─────────────────────────────────────────────────────────────────

function ImageField({ value, src, alt, className }: { value: unknown; src?: (item: any) => string | undefined | null; alt?: string; className?: string }) {
  const url = src ? src(value) : (typeof value === "string" ? value : null);
  if (!url) return <span className={cn("text-xs text-muted-foreground italic", className)}>Sin imagen</span>;
  return (
    <div className={cn("overflow-hidden rounded-md bg-muted", className)}>
      <img src={url} alt={alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

function AvatarField({ value, nameFrom, srcFrom, className }: {
  value: unknown;
  nameFrom?: (item: any) => string;
  srcFrom?: (item: any) => string | undefined | null;
  className?: string;
}) {
  // `value` aquí es el item completo cuando el consumer pasa `render`,
  // o el nombre directo si se usa como semantic estándar.
  const item = (value && typeof value === "object") ? value : null;
  const rawName = item && nameFrom ? nameFrom(item) : (typeof value === "string" ? value : "");
  const rawSrc = item && srcFrom ? srcFrom(item) : undefined;
  const initials = getInitials(rawName);
  return (
    <div className={cn("inline-flex items-center gap-2 min-w-0", className)}>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground/80 ring-1 ring-border/60"
        aria-hidden="true"
      >
        {rawSrc ? (
          <img src={rawSrc} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </span>
      {rawName && <span className="truncate text-xs text-foreground/80">{rawName}</span>}
    </div>
  );
}

function LogoField({ value, src, alt, className }: { value: unknown; src?: string; alt?: string; className?: string }) {
  const url = src ?? (typeof value === "string" ? value : null);
  if (!url) return <span className={cn("text-xs text-muted-foreground italic", className)}>—</span>;
  return (
    <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted/60 p-1", className)}>
      <img src={url} alt={alt ?? ""} className="h-full w-full object-contain" />
    </div>
  );
}

function IconField({ icon, className }: { icon?: ReactNode; className?: string }) {
  if (!icon) return null;
  return (
    <span className={cn("inline-flex h-7 w-7 items-center justify-center text-muted-foreground", className)}>
      {icon}
    </span>
  );
}

export function KpiField({ value, label, thresholds, size, className }: {
  value: unknown;
  label?: string;
  thresholds?: { warning?: number; critical?: number };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const num = Number(value);
  const valid = !isNaN(num);
  const t = thresholds ?? { warning: 10, critical: 0 };
  let state: ItemState = "neutral";
  if (valid) {
    if (num <= (t.critical ?? 0)) state = "error";
    else if (num <= (t.warning ?? 10)) state = "warning";
    else state = "active";
  }
  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      {label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">{label}</span>}
      <span className={kpiVariants({ state, size: size ?? "md" })}>
        {valid ? num.toLocaleString("es-PE") : "—"}
      </span>
    </div>
  );
}

function PairField({ value, label, className }: { value: unknown; label?: string; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      {label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">{label}</span>}
      <span className="text-xs text-foreground/80">{value != null ? String(value) : "—"}</span>
    </div>
  );
}

export function renderField<T>(
  field: FieldDef<T>,
  value: unknown,
  item: T,
  _index: number,
): ReactNode {
  if (field.render) return field.render(value, item, _index);

  // Apply custom field formatter if defined
  const formattedValue = field.format ? field.format(value, item) : value;
  if (formattedValue === null || formattedValue === undefined) return null;

  const semantic = field.semantic ?? inferSemantic(formattedValue, field.key);

  switch (semantic) {
    case "title":      return <Title value={String(formattedValue)} className={field.className} />;
    case "subtitle":   return <Subtitle value={String(formattedValue)} className={field.className} />;
    case "badge":      return <BadgeField value={formattedValue as string | number} className={field.className} />;
    case "number":     return <NumberField value={formattedValue} className={field.className} />;
    case "date":       return <DateField value={formattedValue} className={field.className} />;
    case "code":       return <CodeField value={formattedValue} className={field.className} />;
    case "chip":       return <ChipField value={formattedValue as string} className={field.className} />;
    case "icon-text":  return <IconTextField value={formattedValue} className={field.className} />;
    case "progress":   return <ProgressBar value={formattedValue} className={field.className} />;
    case "status-dot": return <StatusDot value={formattedValue as string} className={field.className} />;
    case "barcode":    return <BarcodeField value={formattedValue} className={field.className} />;

    // Nuevos
    case "image": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyItem = item as any;
      const src = field.imageSrc?.(anyItem) ?? (typeof formattedValue === "string" ? formattedValue : null);
      return <ImageField value={src} src={() => src ?? undefined} alt={field.label} className={field.className} />;
    }
    case "avatar": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyItem = item as any;
      const name = field.initialsFrom ? String(anyItem[field.initialsFrom] ?? "") : String(formattedValue ?? "");
      return (
        <AvatarField
          value={anyItem}
          nameFrom={() => name}
          srcFrom={() => typeof formattedValue === "string" ? formattedValue : null}
          className={field.className}
        />
      );
    }
    case "logo": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyItem = item as any;
      const src = field.imageSrc?.(anyItem) ?? (typeof formattedValue === "string" ? formattedValue : null);
      return <LogoField value={src} src={src ?? undefined} alt={field.label} className={field.className} />;
    }
    case "icon":   return <IconField icon={formattedValue as ReactNode} className={field.className} />;
    case "kpi":    return <KpiField value={formattedValue} label={field.label} thresholds={field.thresholds} className={field.className} />;
    case "pair":   return <PairField value={formattedValue} label={field.label} className={field.className} />;

    default:       return <TextField value={formattedValue} className={field.className} />;
  }
}

export const SEMANTIC_COLOR_MAP: Record<string, string> = {
  activo: "emerald", inactive: "zinc", pending: "amber",
  error: "rose", info: "blue",
};

// Mantener export del helper de estado para uso externo
export { inferState };

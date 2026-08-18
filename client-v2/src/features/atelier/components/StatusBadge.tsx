import { cn } from "@/lib/utils";
import { formatCommissionId } from "../copy";
import { atelierStatusMeta, type AtelierStatusTone } from "../status";

const TONE_CLASS: Record<AtelierStatusTone, string> = {
  quiet: "text-[var(--at-stone)] border-[var(--at-hairline)]",
  accent: "text-[var(--at-accent)] border-[color-mix(in_srgb,var(--at-accent)_35%,transparent)]",
  progress: "text-[var(--at-ink)] border-[var(--at-hairline)]",
  done: "text-[var(--at-ink)] border-[var(--at-ink)]",
  warn: "text-[var(--at-accent)] border-[color-mix(in_srgb,var(--at-accent)_35%,transparent)]",
  stop: "text-[var(--at-stone)] border-[var(--at-hairline)]",
};

type StatusBadgeProps = {
  estado: string;
  kind?: "order" | "quote";
  className?: string;
};

export function StatusBadge({ estado, kind = "order", className }: StatusBadgeProps) {
  const { label, tone } = atelierStatusMeta(estado, kind);
  return (
    <span
      className={cn(
        "at-eyebrow inline-flex items-center border px-2 py-1 text-[10px]",
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Encargo #184 — etiqueta de ficha, no de tabla. */
export function CommissionLabel({ id, className }: { id: number | string; className?: string }) {
  return (
    <span className={cn("at-eyebrow text-[var(--at-ink)]", className)}>{formatCommissionId(id)}</span>
  );
}

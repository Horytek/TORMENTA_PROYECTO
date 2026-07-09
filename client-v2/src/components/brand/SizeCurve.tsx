import { cn } from "@/lib/utils";

/**
 * Curva de TALLAS: chips en mono tabular que muestran el rango de una prenda
 * y qué tallas tienen stock. Otro motivo tomado del mundo del negocio.
 */

type Size = { label: string; available?: boolean };

type SizeCurveProps = {
  sizes: (string | Size)[];
  className?: string;
};

export function SizeCurve({ sizes, className }: SizeCurveProps) {
  const norm: Size[] = sizes.map((s) =>
    typeof s === "string" ? { label: s, available: true } : { available: true, ...s }
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)} role="list" aria-label="Curva de tallas">
      {norm.map((s, i) => (
        <span
          key={`${s.label}-${i}`}
          role="listitem"
          className={cn(
            "num inline-flex min-w-[1.75rem] items-center justify-center rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium leading-none",
            s.available
              ? "border-border bg-secondary text-secondary-foreground"
              : "border-dashed border-border/60 bg-transparent text-muted-foreground/50 line-through"
          )}
        >
          {s.label}
        </span>
      ))}
    </div>
  );
}

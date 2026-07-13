import { cn } from "@/lib/utils";

/**
 * Firma de la identidad "Taller de datos".
 * Puntos de color reales que representan las TONALIDADES de una prenda —
 * el vocabulario propio del negocio, no un adorno genérico.
 */

type SwatchStripProps = {
  colors: string[];
  size?: "sm" | "md" | "lg";
  max?: number;
  className?: string;
  label?: string;
};

const dotSize = { sm: "h-2.5 w-2.5", md: "h-3.5 w-3.5", lg: "h-5 w-5" };
const overlap = { sm: "-ml-1", md: "-ml-1.5", lg: "-ml-2" };

export function SwatchStrip({ colors, size = "md", max = 6, className, label }: SwatchStripProps) {
  const shown = colors.slice(0, max);
  const rest = colors.length - shown.length;

  return (
    <div className={cn("flex items-center", className)} aria-label={label ?? `${colors.length} tonalidades`}>
      <div className="flex items-center">
        {shown.map((c, i) => (
          <span
            key={`${c}-${i}`}
            className={cn(
              "rounded-full ring-2 ring-card shadow-sm transition-transform hover:-translate-y-0.5",
              dotSize[size],
              i > 0 && overlap[size]
            )}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
      {rest > 0 && (
        <span className={cn("num ml-2 text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs")}>
          +{rest}
        </span>
      )}
    </div>
  );
}

/** Punto único de tonalidad, para inline en tablas/celdas. */
export function SwatchDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block h-3 w-3 rounded-full ring-2 ring-card align-middle", className)}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

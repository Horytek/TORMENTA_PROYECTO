import { cn } from "@/lib/utils";
import type { Disponibilidad } from "../utils/disponibilidad";

const TONE: Record<string, string> = {
  disponible: "bg-emerald-500/15 text-emerald-800",
  limitado: "bg-amber-500/15 text-amber-900",
  consultar: "bg-amber-500/15 text-amber-900",
  agotado: "bg-red-500/15 text-red-700",
  proximamente: "bg-stone-500/15 text-stone-700",
};

const DOT: Record<string, string> = {
  disponible: "🟢",
  limitado: "🟡",
  consultar: "🟡",
  agotado: "🔴",
  proximamente: "⚪",
};

export function AvailabilityStatus({
  disp,
  className,
  showHint = true,
}: {
  disp: Disponibilidad;
  className?: string;
  showHint?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
          TONE[disp.estado]
        )}
      >
        <span aria-hidden>{DOT[disp.estado]}</span>
        {disp.label}
      </span>
      {showHint && (
        <p className="text-xs store-muted leading-relaxed">
          {disp.confianza || disp.hint}
        </p>
      )}
    </div>
  );
}

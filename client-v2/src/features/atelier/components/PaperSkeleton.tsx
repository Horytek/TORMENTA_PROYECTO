import { cn } from "@/lib/utils";

/** Esqueleto de papel: líneas y un marco, no spinner genérico. */
export function PaperSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("at-skel", className)} aria-busy="true" aria-label="Cargando">
      <div className="at-skel-frame" />
      <div className="at-skel-line at-skel-line-lg" />
      <div className="at-skel-line" />
      <div className="at-skel-line at-skel-line-sm" />
    </div>
  );
}

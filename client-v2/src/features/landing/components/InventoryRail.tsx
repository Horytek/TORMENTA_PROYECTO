import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Firma visual del landing: "Hilo de inventario".
 * Una línea vertical de 1px al borde izquierdo con ticks por sección.
 * Cada checkpoint se llena cuando su sección entra al viewport.
 *
 * CSS-only en lo posible; IntersectionObserver solo para los checkpoints.
 * Respeta prefers-reduced-motion (transiciones cortas heredadas del global).
 */
export function InventoryRail({
  checkpoints,
}: {
  /** IDs de sección en orden de aparición, sin el `#`. */
  checkpoints: readonly string[];
}) {
  const [active, setActive] = useState<Set<string>>(new Set());
  const refs = useRef<Map<string, IntersectionObserver>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setActive((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const id = entry.target.id;
            if (!id) continue;
            if (entry.isIntersecting) next.add(id);
          }
          return next;
        });
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 },
    );

    for (const id of checkpoints) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        refs.current.set(id, observer);
      }
    }

    return () => observer.disconnect();
  }, [checkpoints]);

  const filledCount = active.size;

  return (
    <aside
      aria-hidden
      className="pointer-events-none fixed left-4 top-0 z-30 hidden h-screen w-px md:block"
    >
      {/* Línea vertical */}
      <div className="absolute inset-y-0 left-0 w-px bg-border/70" />

      {/* Ticks decorativos cada ~12vh, para textura */}
      <div
        className="absolute inset-y-0 left-0 w-px opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, hsl(var(--border)) 0 1px, transparent 1px 96px)",
        }}
      />

      {/* Checkpoints por sección */}
      <div className="absolute inset-y-0 -left-[3px] flex flex-col">
        {checkpoints.map((id) => {
          const filled = active.has(id);
          return (
            <span
              key={id}
              className="relative h-[20vh] w-[7px] first:mt-[10vh] last:mb-[10vh]"
              aria-hidden
            >
              <span
                className={cn(
                  "absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-500",
                  filled
                    ? "scale-100 border-brand bg-brand"
                    : "scale-50 border-border bg-background",
                )}
              />
            </span>
          );
        })}
      </div>

      {/* Contador sutil abajo: "X / total" checkpoints llenos */}
      <div className="num absolute -left-3 bottom-6 flex w-12 -translate-x-1/2 flex-col items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="font-mono">
          {String(filledCount).padStart(2, "0")}
          <span className="opacity-40">/{String(checkpoints.length).padStart(2, "0")}</span>
        </span>
        <span className="h-3 w-px bg-border" />
      </div>
    </aside>
  );
}

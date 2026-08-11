import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Tarjeta flotante compartida — cada escena personaliza el interior. */
export function SceneCard({
  children,
  className,
  rotate = true,
  accent,
}: {
  children: ReactNode;
  className?: string;
  rotate?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-[min(100%,20rem)] rounded-xl border border-black/10 bg-[#FAFAF8] p-5 text-[#1c1917] shadow-2xl",
        rotate && "-rotate-2",
        className
      )}
      style={accent ? { boxShadow: `0 25px 50px -12px ${accent}55` } : undefined}
    >
      {children}
    </div>
  );
}

export function SceneLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/45">{children}</p>
  );
}

export function SceneChip({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  );
}

export function SceneProgress({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-black/8">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

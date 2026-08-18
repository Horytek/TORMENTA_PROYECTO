import { cn } from "@/lib/utils";

const STEPS = [
  { id: "idea", label: "IDEA" },
  { id: "boceto", label: "BOCETO" },
  { id: "obra", label: "OBRA" },
] as const;

export type TimelinePhase = (typeof STEPS)[number]["id"];

export function orderPhase(estado: string): TimelinePhase {
  if (estado === "final_delivery" || estado === "completed") return "obra";
  if (estado === "preview" || estado === "revision") return "boceto";
  return "idea";
}

/** IDEA → BOCETO → OBRA. Estados de BD se conservan; aquí solo la fase humana. */
export function CommissionTimeline({ estado, className }: { estado: string; className?: string }) {
  const current = orderPhase(estado);
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className={cn("flex items-center gap-0", className)} aria-label="Proceso de la obra">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 flex-col items-start">
              <span
                className={cn(
                  "at-eyebrow text-[10px]",
                  active ? "text-[var(--at-accent)]" : done ? "text-[var(--at-ink)]" : "text-[var(--at-stone)]",
                )}
              >
                {step.label}
              </span>
              <span
                className={cn(
                  "mt-2 h-[2px] w-full",
                  active || done ? "bg-[var(--at-ink)]" : "bg-[var(--at-hairline)]",
                )}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

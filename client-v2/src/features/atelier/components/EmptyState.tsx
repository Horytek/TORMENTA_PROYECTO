import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ATELIER_COPY } from "../copy";
import { AtelierButton } from "./AtelierButton";

type EmptyStateProps = {
  title?: string;
  body?: string;
  /** empty = sin obras/encargos; error = fallo de proceso (nunca "Error 500"). */
  tone?: "empty" | "error";
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  body,
  tone = "empty",
  action,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const heading = title ?? (tone === "error" ? ATELIER_COPY.processInterrupted : ATELIER_COPY.emptyAtelier);
  const copy = body ?? (tone === "error" ? ATELIER_COPY.processInterruptedBody : ATELIER_COPY.emptyAtelierBody);
  return (
    <div className={cn("px-4 py-16 text-center md:py-24", className)}>
      <div
        aria-hidden
        className="mx-auto mb-8 size-16 border border-[var(--at-hairline)] bg-[var(--at-offwhite)]"
      />
      <h2 className="at-display mx-auto max-w-md text-[1.65rem] text-[var(--at-ink)] md:text-3xl">{heading}</h2>
      {copy ? <p className="at-ui at-measure mx-auto mt-3 text-[15px] leading-relaxed text-[var(--at-stone)]">{copy}</p> : null}
      {action ? (
        <div className="mt-8 flex justify-center">{action}</div>
      ) : actionLabel && onAction ? (
        <div className="mt-8 flex justify-center">
          <AtelierButton type="button" onClick={onAction}>
            {actionLabel}
          </AtelierButton>
        </div>
      ) : null}
    </div>
  );
}

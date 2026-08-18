import { cn } from "@/lib/utils";

export type ArtistSignatureProps = {
  name: string;
  mark?: string;
  avatarSrc?: string;
  available?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** Firma digital del artista: serif + marca pequeña. */
export function ArtistSignature({
  name,
  mark,
  avatarSrc,
  available,
  size = "md",
  className,
}: ArtistSignatureProps) {
  const compact = size === "sm";

  return (
    <figure className={cn("flex items-center gap-2.5", className)}>
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt=""
          className={cn("shrink-0 rounded-full object-cover", compact ? "size-7" : "size-10")}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--at-ink)_8%,transparent)] at-display text-[var(--at-ink)]",
            compact ? "size-7 text-sm" : "size-10 text-lg",
          )}
        >
          {name.slice(0, 1)}
        </span>
      )}
      <figcaption className="min-w-0">
        <p className={cn("at-display truncate text-[var(--at-ink)]", compact ? "text-[0.95rem]" : "text-lg")}>
          {name}
        </p>
        {mark ? (
          <p className="at-eyebrow mt-0.5 truncate text-[10px]">{mark}</p>
        ) : available != null ? (
          <p className="at-ui mt-0.5 text-[11px] text-[var(--at-stone)]">
            {available ? "Disponible para encargos" : "No toma encargos ahora"}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}

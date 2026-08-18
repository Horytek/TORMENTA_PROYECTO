import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ATELIER_COPY } from "../copy";
import { ArtistSignature, type ArtistSignatureProps } from "./ArtistSignature";

const ASPECTS = ["4/5", "3/4", "1/1", "5/6", "2/3"] as const;

export function artworkAspect(seed: string | number) {
  const n = typeof seed === "number" ? seed : Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return ASPECTS[Math.abs(n) % ASPECTS.length];
}

type ArtworkCardProps = {
  title: string;
  href?: string;
  imageSrc?: string;
  imageAlt?: string;
  aspect?: string;
  /** Overlay "Private commission" — obra de encargo, no portfolio público. */
  privateCommission?: boolean;
  artist?: ArtistSignatureProps;
  footer?: ReactNode;
  className?: string;
};

export function ArtworkCard({
  title,
  href,
  imageSrc,
  imageAlt = "",
  aspect,
  privateCommission = false,
  artist,
  footer,
  className,
}: ArtworkCardProps) {
  const media = (
    <div
      className="relative overflow-hidden bg-[color-mix(in_srgb,var(--at-ink)_6%,var(--at-offwhite))]"
      style={{ aspectRatio: aspect || "4/5" }}
    >
      {imageSrc ? (
        <img src={imageSrc} alt={imageAlt} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-end p-4">
          <span className="at-display text-2xl text-[color-mix(in_srgb,var(--at-ink)_28%,transparent)]">{title}</span>
        </div>
      )}
      {privateCommission ? (
        <span className="at-eyebrow absolute left-3 top-3 bg-[var(--at-offwhite)]/90 px-2 py-1 text-[10px] text-[var(--at-ink)]">
          {ATELIER_COPY.privateCommission}
        </span>
      ) : null}
    </div>
  );

  return (
    <article className={cn("group text-left", className)}>
      {href ? (
        <Link to={href} className="at-focus block">
          {media}
        </Link>
      ) : (
        media
      )}
      <div className="mt-3 space-y-1.5">
        <h3 className="at-display text-[1.15rem] leading-snug text-[var(--at-ink)]">{title}</h3>
        {artist ? <ArtistSignature {...artist} size="sm" /> : null}
        {footer}
      </div>
    </article>
  );
}

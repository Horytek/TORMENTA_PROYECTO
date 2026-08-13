type Props = {
  headline: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function PromoBanner({ headline, body, imageUrl, ctaLabel, ctaHref }: Props) {
  const href = ctaHref || "#catalogo";
  return (
    <section className="relative overflow-hidden vitrina-stage-bg text-white">
      {imageUrl && (
        <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
      )}
      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-14 lg:py-20">
        <h2 className="vitrina-display text-4xl sm:text-5xl max-w-2xl">{headline}</h2>
        {body && <p className="mt-4 text-white/70 max-w-lg text-base">{body}</p>}
        <a
          href={href}
          className="vitrina-pill mt-8 inline-flex h-11 items-center px-5 text-sm font-semibold text-white"
          style={{ background: "var(--vitrina-accent)" }}
        >
          {ctaLabel || "Explorar"}
        </a>
      </div>
    </section>
  );
}

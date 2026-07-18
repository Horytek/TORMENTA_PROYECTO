import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { HorytekIcon } from "@/components/brand/HorytekIcon";
import { FOOTER_BRAND, FOOTER_LINKS, FOOTER_SOCIALS } from "../data/landing.data";

/**
 * Iconos sociales inline — lucide-react v1.23.0 no exporta Facebook/Instagram/Twitter,
 * así que los dibujo en SVG (4–10 líneas cada uno). Sin peso de dependencias.
 */
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M13.5 21v-7.5h2.55l.4-3.05H13.5V8.575c0-.875.25-1.475 1.5-1.475h1.6V4.375a21 21 0 0 0-2.35-.125c-2.325 0-3.925 1.425-3.925 4.025v2.225H8v3.05h2.325V21h3.175z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  instagram: InstagramIcon,
} as const;

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <HorytekIcon size={22} className="text-primary" />
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                {FOOTER_BRAND.name}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              {FOOTER_BRAND.description}
            </p>

            {/* Redes sociales */}
            <ul className="mt-5 flex items-center gap-2" aria-label="Redes sociales">
              {FOOTER_SOCIALS.map((s) => {
                const Icon = SOCIAL_ICONS[s.icon as keyof typeof SOCIAL_ICONS];
                if (!Icon) return null;
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${FOOTER_BRAND.name} en ${s.label}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Columnas de links */}
          {FOOTER_LINKS.map((section) => (
            <nav key={section.title} aria-labelledby={`footer-${section.title}`}>
              <h3
                id={`footer-${section.title}`}
                className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground"
              >
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center">
          <span className="num">
            © {new Date().getFullYear()} HoryTek Inc. Todos los derechos reservados.
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.12em]">
            <span>Diseñado con precisión en Perú</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ link }: { link: { label: string; href: string } }) {
  const isExternal = link.href.startsWith("http");
  const isMailto = link.href.startsWith("mailto:");
  // Los enlaces con "#" (anclas, incl. "/#seccion" desde otras páginas) usan <a> nativo:
  // salta en la misma página o navega y luego salta, sin lógica de scroll manual.
  const isHash = link.href.includes("#") || link.href.startsWith("?");

  const className =
    "group inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground";

  const content = (
    <>
      <ChevronRight
        className="h-3 w-3 -translate-x-1 text-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
        aria-hidden
      />
      <span className="transition-transform group-hover:translate-x-0.5">{link.label}</span>
    </>
  );

  if (isExternal) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer noopener" className={className}>
        {content}
      </a>
    );
  }
  if (isMailto || isHash) {
    return (
      <a href={link.href} className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link to={link.href} className={className}>
      {content}
    </Link>
  );
}
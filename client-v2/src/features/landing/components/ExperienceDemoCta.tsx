import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { demoLinksForProduct } from "../data/demoLinks";
import { getProductTheme } from "@/features/platform/ui/productThemes";

/** CTA vivo bajo experience landings — abre demos seedables por superficie. */
export function ExperienceDemoCta({ productId }: { productId: string }) {
  const demos = demoLinksForProduct(productId);
  if (demos.length === 0) return null;
  const theme = getProductTheme(productId);
  const byKind = {
    portal: demos.filter((d) => d.kind === "portal"),
    ops: demos.filter((d) => d.kind === "ops"),
    admin: demos.filter((d) => d.kind === "admin"),
  };
  const primary = demos[0];
  const secondary = [...byKind.portal, ...byKind.ops, ...byKind.admin].filter(
    (d) => d.href !== primary.href
  );

  return (
    <section className="relative overflow-hidden border-t border-black/10" style={{ backgroundColor: theme.ink, color: "#fff" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: theme.accent }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 md:flex-row md:items-end md:justify-between md:py-16">
        <div className="max-w-xl">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: theme.accent }}
          >
            Demo en vivo · {theme.name}
          </p>
          <p className="mt-3 text-[clamp(1.15rem,2.2vw,1.45rem)] font-semibold leading-snug tracking-tight">
            Entra con datos seed (slug <span className="font-mono text-[0.95em]">demo</span>) — un
            clic a portal, ops o admin.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-white/55">
            Local:{" "}
            <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-white/80">
              npm run seed:platform-demo
            </code>
            {productId === "catalogo-wa" ? (
              <>
                {" "}
                · catálogo en{" "}
                <span className="font-mono text-white/75">/catalogo/1</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <Link
            to={primary.href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
            style={{ backgroundColor: theme.accent, color: "#fff", boxShadow: `0 16px 36px -18px ${theme.accent}` }}
          >
            {primary.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {secondary.length > 0 ? (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {secondary.slice(0, 4).map((d) => (
                <Link
                  key={d.href}
                  to={d.href}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-[12px] font-semibold text-white/90 transition-colors hover:bg-white/10"
                >
                  <span className="text-[10px] uppercase tracking-wide text-white/45">{d.kind}</span>
                  {d.label}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

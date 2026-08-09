import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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

  return (
    <section
      className="border-t border-black/10 px-6 py-12"
      style={{ backgroundColor: theme.ink, color: "#fff" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: theme.accentSoft }}
          >
            Demo en vivo · {theme.name}
          </p>
          <p className="mt-2 max-w-lg text-[16px] font-medium leading-snug">
            Entra con datos seed (slug <span className="font-mono">demo</span>) — un clic a portal,
            ops o admin.
          </p>
          <p className="mt-2 text-[12px] text-white/55">
            Local: <code className="rounded bg-white/10 px-1">npm run seed:platform-demo</code>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to={primary.href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold"
            style={{ backgroundColor: theme.accent, color: "#fff" }}
          >
            {primary.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <div className="flex flex-wrap gap-2">
            {[...byKind.portal, ...byKind.ops, ...byKind.admin]
              .filter((d) => d.href !== primary.href)
              .slice(0, 4)
              .map((d) => (
                <Link
                  key={d.href}
                  to={d.href}
                  className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-3 py-2 text-[12px] font-semibold text-white/90 hover:bg-white/10"
                >
                  <span className="mr-1.5 text-[10px] uppercase tracking-wide text-white/50">
                    {d.kind}
                  </span>
                  {d.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

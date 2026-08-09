import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/features/landing/components/MarketingHeader";
import { Footer } from "@/features/landing/components/Footer";
import {
  HORYTEK_BUNDLES,
  HORYTEK_PRODUCTS,
  productsInBundle,
} from "@/features/platform/catalog/horytekProducts";
import { getLoginAccent } from "@/features/auth/loginAccents";
import { getProductTheme } from "@/features/platform/ui/productThemes";
import { demoLinksForProduct } from "@/features/landing/data/demoLinks";

function accentFor(productId: string, loginMode: string) {
  const theme = getProductTheme(productId);
  if (theme.id === productId) return theme.accent;
  return getLoginAccent(loginMode);
}

export default function SolucionesPage() {
  const live = HORYTEK_PRODUCTS.filter((p) => p.wave === "existing" || p.wave === "A");
  const roadmap = HORYTEK_PRODUCTS.filter((p) => p.wave !== "existing" && p.wave !== "A");

  return (
    <div className="min-h-screen w-full bg-[#f4f7f6]">
      <MarketingHeader activeNav="soluciones" />

      <section className="relative overflow-hidden border-b border-black/5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 0%, #ccfbf1 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 20%, #e0e7ff 0%, transparent 50%), #f4f7f6",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Soluciones
          </span>
          <h1 className="mt-3 max-w-2xl text-balance text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900">
            Productos únicos. Bundles que componen.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600">
            Cada producto resuelve un solo trabajo, con su propia base cuando el dominio lo exige. Los
            bundles solo agrupan productos ya definidos — nada a medias.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <section>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Bundles
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {HORYTEK_BUNDLES.map((bundle) => {
              const products = productsInBundle(bundle);
              const tone = accentFor(products[0]?.id ?? "erp", products[0]?.loginMode ?? "erp");
              return (
                <Link
                  key={bundle.id}
                  to={`/soluciones/bundle/${bundle.id}`}
                  className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[18px] font-semibold tracking-tight text-slate-900">
                        {bundle.name}
                      </h3>
                      <p className="mt-1 text-[13px] text-slate-500">{bundle.buyer}</p>
                    </div>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition-transform group-hover:translate-x-0.5"
                      style={{ backgroundColor: tone }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 flex-1 text-[14px] leading-relaxed text-slate-600">
                    {bundle.pitch}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {products.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${tone}18`, color: tone }}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Productos disponibles
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((p) => {
              const tone = accentFor(p.id, p.loginMode);
              const demo = demoLinksForProduct(p.id)[0];
              return (
                <article
                  key={p.id}
                  className="flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
                  style={{ borderTopColor: tone, borderTopWidth: 3 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[16px] font-semibold text-slate-900">{p.name}</h3>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">
                      {p.wave === "existing" ? "Live" : `Oleada ${p.wave}`}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] font-medium" style={{ color: tone }}>
                    {p.job}
                  </p>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-slate-600">{p.pitch}</p>
                  <p className="mt-2 text-[11px] capitalize text-slate-400">
                    {p.surfaces.join(" · ")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {demo ? (
                      <Link
                        to={demo.href}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 py-2 text-[12px] font-semibold text-white"
                        style={{ backgroundColor: tone }}
                      >
                        Abrir demo <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                    <Link
                      to={`/?product=${p.id}`}
                      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700"
                    >
                      Landing
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            En roadmap
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((p) => (
              <Link
                key={p.id}
                to={`/?product=${p.id}`}
                className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 transition-colors hover:border-slate-400"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-medium text-slate-900">{p.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">{p.wave}</span>
                </div>
                <p className="mt-1 text-[12px] text-slate-500">{p.job}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-[14px] font-semibold text-white"
          >
            Elegir producto e ingresar <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contactanos"
            className="inline-flex items-center text-[14px] font-medium text-slate-600 underline-offset-4 hover:underline"
          >
            Hablar con ventas
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

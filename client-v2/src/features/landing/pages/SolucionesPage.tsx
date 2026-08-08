import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/features/landing/components/MarketingHeader";
import { Footer } from "@/features/landing/components/Footer";
import { HORYTEK_BUNDLES, HORYTEK_PRODUCTS, productsInBundle } from "@/features/platform/catalog/horytekProducts";

export default function SolucionesPage() {
  const live = HORYTEK_PRODUCTS.filter((p) => p.wave === "existing" || p.wave === "A");
  const roadmap = HORYTEK_PRODUCTS.filter((p) => p.wave !== "existing" && p.wave !== "A");

  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />

      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Soluciones
          </span>
          <h1 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Productos únicos. Bundles que componen.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Cada producto resuelve un solo trabajo, con su propia base cuando el dominio lo exige.
            Los bundles solo agrupan productos ya definidos — nada a medias.
          </p>
        </div>

        <section className="mt-16">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Bundles
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {HORYTEK_BUNDLES.map((bundle) => {
              const products = productsInBundle(bundle);
              return (
                <Link
                  key={bundle.id}
                  to={`/soluciones/bundle/${bundle.id}`}
                  className="group block border-b border-border/70 pb-5 transition-colors hover:border-foreground/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
                        {bundle.name}
                      </h3>
                      <p className="mt-1 text-[13px] text-muted-foreground">{bundle.buyer}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                    {bundle.pitch}
                  </p>
                  <p className="mt-3 text-[12px] text-muted-foreground/90">
                    {products.map((p) => p.name).join(" · ")}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Productos disponibles
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {live.map((p) => (
              <Link
                key={p.id}
                to={`/soluciones/${p.slug}`}
                className="group block border-b border-border/70 pb-4 transition-colors hover:border-foreground/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
                    {p.name}
                  </h3>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {p.wave === "existing" ? "Live" : `Oleada ${p.wave}`}
                  </span>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{p.pitch}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            En roadmap
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((p) => (
              <Link
                key={p.id}
                to={`/soluciones/${p.slug}`}
                className="block rounded-none border border-border/50 px-4 py-3 transition-colors hover:border-foreground/30"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-medium text-foreground">{p.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {p.wave}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{p.job}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-foreground underline-offset-4 hover:underline"
          >
            Elegir producto e ingresar <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contactanos"
            className="text-[14px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Hablar con ventas
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

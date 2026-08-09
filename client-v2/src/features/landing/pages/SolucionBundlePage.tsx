import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/features/landing/components/MarketingHeader";
import { Footer } from "@/features/landing/components/Footer";
import { getBundleById, productsInBundle } from "@/features/platform/catalog/horytekProducts";

export default function SolucionBundlePage() {
  const { id = "" } = useParams();
  const bundle = getBundleById(id);

  if (!bundle) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <main className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="text-2xl font-semibold">Bundle no encontrado</h1>
          <Link to="/soluciones" className="mt-4 inline-block text-sm text-muted-foreground hover:underline">
            ← Volver a soluciones
          </Link>
        </main>
      </div>
    );
  }

  const products = productsInBundle(bundle);

  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link to="/soluciones" className="text-[13px] text-muted-foreground hover:text-foreground">
          ← Soluciones
        </Link>
        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Bundle · {bundle.buyer}
        </p>
        <h1 className="mt-2 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
          {bundle.name}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">{bundle.pitch}</p>
        <p className="mt-6 text-[13px] text-muted-foreground">
          Solo compone productos completos. Cada uno mantiene su propia base de datos.
        </p>

        <ul className="mt-10 space-y-4 border-t border-border/60 pt-8">
          {products.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-4 border-b border-border/50 pb-4">
              <div>
                <Link
                  to={`/?product=${p.id}`}
                  className="text-[16px] font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {p.name}
                </Link>
                <p className="mt-1 text-[13px] text-muted-foreground">{p.job}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  BD: {p.database || "ERP"} · {p.surfaces.join(", ")}
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </li>
          ))}
        </ul>

        <Link
          to="/login"
          className="mt-12 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[13px] font-medium text-background"
        >
          Empezar <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </main>
      <Footer />
    </div>
  );
}

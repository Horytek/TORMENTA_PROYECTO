import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/features/landing/components/MarketingHeader";
import { Footer } from "@/features/landing/components/Footer";
import {
  getProductBySlug,
  HORYTEK_BUNDLES,
  PRODUCT_DEFINITION_OF_DONE,
} from "@/features/platform/catalog/horytekProducts";

export default function SolucionProductoPage() {
  const { slug = "" } = useParams();
  const product = getProductBySlug(slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <main className="mx-auto max-w-3xl px-6 py-24">
          <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
          <Link to="/soluciones" className="mt-4 inline-block text-sm text-muted-foreground hover:underline">
            ← Volver a soluciones
          </Link>
        </main>
      </div>
    );
  }

  const bundles = HORYTEK_BUNDLES.filter((b) => b.productIds.includes(product.id));
  const loginHref =
    product.loginMode === "mayorista"
      ? "/login?mode=mayorista"
      : product.loginMode === "express"
        ? "/login?mode=express"
        : product.loginMode === "ecommerce"
          ? "/login?mode=ecommerce"
          : "/login?mode=erp";

  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link to="/soluciones" className="text-[13px] text-muted-foreground hover:text-foreground">
          ← Soluciones
        </Link>
        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {product.wave === "existing" ? "Disponible" : `Oleada ${product.wave}`}
        </p>
        <h1 className="mt-2 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
          {product.name}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">{product.pitch}</p>
        <p className="mt-2 text-[14px] text-muted-foreground">
          <span className="font-medium text-foreground">Job:</span> {product.job}
        </p>

        <dl className="mt-10 grid gap-4 border-y border-border/60 py-6 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Base de datos</dt>
            <dd className="mt-1 font-medium text-foreground">
              {product.database || "Reusa ERP (sin BD propia)"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Aislamiento</dt>
            <dd className="mt-1 font-medium text-foreground">{product.isolation}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Superficies</dt>
            <dd className="mt-1 font-medium capitalize text-foreground">
              {product.surfaces.join(" · ")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">No incluye</dt>
            <dd className="mt-1 text-foreground">{product.notIncludes.join("; ")}</dd>
          </div>
        </dl>

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em]">Definition of Done</h2>
          <ul className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
            {PRODUCT_DEFINITION_OF_DONE.map((item) => (
              <li key={item}>· {item.replaceAll("_", " ")}</li>
            ))}
          </ul>
        </section>

        {bundles.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em]">En bundles</h2>
            <ul className="mt-3 space-y-2">
              {bundles.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/soluciones/bundle/${b.id}`}
                    className="text-[14px] font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            to={loginHref}
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[13px] font-medium text-background"
          >
            Ingresar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {product.adminPath && product.wave === "A" && (
            <span className="self-center text-[12px] text-muted-foreground">
              Admin: {product.adminPath}
              {product.clientPath ? ` · Cliente: ${product.clientPath}` : ""}
            </span>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

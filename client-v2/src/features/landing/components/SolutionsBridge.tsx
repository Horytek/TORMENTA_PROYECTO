import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HORYTEK_PRODUCTS } from "@/features/platform/catalog/horytekProducts";
import { getProductTheme } from "@/features/platform/ui/productThemes";

const BRIDGE_IDS = ["taxi", "delivery", "mayorista", "academia", "envios", "crm", "wms", "agenda"] as const;

/** Puente a catálogo — rail de acentos, no clone del grid /soluciones. */
export function SolutionsBridge() {
  const items = BRIDGE_IDS.map((id) => HORYTEK_PRODUCTS.find((p) => p.id === id)).filter(
    Boolean
  ) as typeof HORYTEK_PRODUCTS;

  return (
    <section
      id="soluciones-puente"
      className="relative overflow-hidden border-b border-border/60 py-16 md:py-20"
      style={{
        background:
          "linear-gradient(105deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-lg">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Catálogo de productos
            </span>
            <h2 className="mt-2 text-balance text-[clamp(1.45rem,3vw,2rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
              Un job, un producto. Elige y prueba con datos demo.
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Puente corto desde el ERP — el detalle vive en el catálogo, no aquí.
            </p>
          </div>
          <Link
            to="/soluciones"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background"
          >
            Ver catálogo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((p) => {
            const theme = getProductTheme(p.id);
            return (
              <Link
                key={p.id}
                to={`/?product=${p.id}`}
                className="group flex min-w-[9.5rem] flex-col justify-between rounded-2xl border border-black/8 bg-white/90 px-4 py-4 shadow-sm transition-transform hover:-translate-y-0.5"
                style={{ borderTopWidth: 3, borderTopColor: theme.accent }}
              >
                <p className="text-[14px] font-semibold" style={{ color: theme.ink }}>
                  {p.name}
                </p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-black/50">{p.job}</p>
                <span
                  className="mt-3 text-[11px] font-semibold"
                  style={{ color: theme.accent }}
                >
                  Ver ficha →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

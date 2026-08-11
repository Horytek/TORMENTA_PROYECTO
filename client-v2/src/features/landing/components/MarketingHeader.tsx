import { Link } from "react-router-dom";
import { HorytekIcon } from "@/components/brand/HorytekIcon";
import { cn } from "@/lib/utils";

type MarketingHeaderProps = {
  productId?: string;
  productName?: string;
  accent?: string;
  surface?: string;
  loginHref?: string;
  demoHref?: string;
  activeNav?: "soluciones" | null;
};

/** Header para catálogo / fichas — se adapta al producto cuando hay contexto. */
export function MarketingHeader({
  productName,
  accent,
  surface,
  loginHref = "/login",
  demoHref = "/soluciones",
  activeNav = null,
}: MarketingHeaderProps) {
  const tinted = Boolean(accent || surface);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md",
        !tinted && "border-border/60 bg-background/80"
      )}
      style={{
        borderColor: tinted ? `${accent || "#0f172a"}22` : undefined,
        backgroundColor: surface ? `${surface}cc` : undefined,
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-foreground" aria-label="Horytek — Inicio">
          <HorytekIcon size={22} style={accent ? { color: accent } : undefined} className={!accent ? "text-primary" : undefined} />
          <span className="text-[15px] font-semibold tracking-tight">
            Horytek
            {productName ? (
              <span className="ml-1.5 font-semibold" style={{ color: accent }}>
                {productName}
              </span>
            ) : null}
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/soluciones"
            className={cn(
              "text-[13px] transition-colors",
              activeNav === "soluciones"
                ? "font-semibold text-foreground underline decoration-2 underline-offset-8"
                : "font-medium text-muted-foreground hover:text-foreground"
            )}
            style={
              activeNav === "soluciones" && accent
                ? { textDecorationColor: accent }
                : undefined
            }
          >
            Soluciones
          </Link>
          <Link
            to={loginHref}
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ingresar
          </Link>
          <Link
            to={demoHref}
            className="inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-[12px] font-semibold text-white"
            style={{ backgroundColor: accent || "#0f172a" }}
          >
            Probar demo
          </Link>
        </nav>
      </div>
    </header>
  );
}

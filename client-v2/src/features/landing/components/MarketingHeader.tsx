import { Link } from "react-router-dom";
import { HorytekIcon } from "@/components/brand/HorytekIcon";

/** Header liviano para páginas satélite del footer (no lleva el toggle Standard/Pocket del landing). */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-foreground" aria-label="Horytek — Inicio">
          <HorytekIcon size={22} className="text-primary" />
          <span className="text-[15px] font-semibold tracking-tight">Horytek</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            to="/soluciones"
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Soluciones
          </Link>
          <Link
            to="/login"
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ingresar
          </Link>
          <Link
            to="/"
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Inicio
          </Link>
        </nav>
      </div>
    </header>
  );
}

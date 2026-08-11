import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HorytekIcon } from "@/components/brand/HorytekIcon";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductSwitcher } from "./ProductSwitcher";
import { getLandingModule } from "../modules/landingModules.registry";
import { HORYTEK_PRODUCTS } from "@/features/platform/catalog/horytekProducts";
import { buildNavLinks } from "./buildNavLinks";
import { DemoSurfacesDropdown } from "./DemoSurfacesDropdown";

interface HeaderProps {
  productId: string;
  onProductChange: (productId: string) => void;
}

export function Header({ productId, onProductChange }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const module = getLandingModule(productId);
  const product = HORYTEK_PRODUCTS.find((p) => p.id === productId);
  const isPocket = productId === "pocket";
  const isEcommerce = productId === "ecommerce";
  const navLinks = buildNavLinks(productId, product?.name ?? module.name, module);

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors"
      style={{
        borderColor: module.accent.headerBorder || undefined,
        backgroundColor: module.renderer === "legacy" ? undefined : `${module.accent.surface}cc`,
      }}
    >
      <div
        className={cn(
          "mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6",
          module.renderer === "legacy" &&
            (isPocket
              ? "border-amber-500/0"
              : isEcommerce
                ? ""
                : ""),
        )}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground"
          aria-label="Horytek — Inicio"
          onClick={() => onProductChange("erp")}
        >
          <HorytekIcon
            size={22}
            className={cn(
              isPocket ? "text-amber-600" : isEcommerce ? "text-teal-700" : "text-primary",
            )}
          />
          <span className="text-[15px] font-semibold tracking-tight">
            Horytek
            {product && productId !== "erp" && (
              <span className="ml-1" style={{ color: module.accent.accent }}>
                {product.name}
              </span>
            )}
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
          <Link
            to="/soluciones"
            className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Soluciones
          </Link>
          {navLinks.map((l) => (
            <a
              key={`${l.href}-${l.label}`}
              href={l.href}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ProductSwitcher
            productId={productId}
            onProductChange={onProductChange}
            alwaysVisible
          />

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to={module.loginHref}>Iniciar sesión</Link>
          </Button>
          {module.renderer === "experience" ? (
            <div className="hidden sm:block">
              <DemoSurfacesDropdown
                productId={productId}
                accent={module.accent.accent}
                size="sm"
                label="Probar demo"
                fallbackHref={`/?product=${productId}#planes`}
              />
            </div>
          ) : (
            <Button
              asChild
              size="sm"
              className={cn("hidden gap-1.5 text-white sm:inline-flex")}
              style={{ backgroundColor: module.accent.accent }}
            >
              {isEcommerce ? (
                <Link to={module.loginHref}>
                  Empezar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : isPocket ? (
                <Link to="/login?mode=express">
                  Empezar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link to="/soluciones">
                  Probar demo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </Button>
          )}

          <button
            type="button"
            className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-background px-6 py-4 md:hidden">
          <ul className="space-y-3">
            <li>
              <Link
                to="/soluciones"
                onClick={() => setMobileOpen(false)}
                className="block text-[14px] font-medium text-foreground/90"
              >
                Soluciones
              </Link>
            </li>
            {navLinks.map((l) => (
              <li key={`${l.href}-${l.label}`}>
                <a
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-[14px] font-medium text-foreground/90"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to={module.loginHref}
                onClick={() => setMobileOpen(false)}
                className="block text-[14px] font-medium text-foreground/90"
              >
                Iniciar sesión
              </Link>
            </li>
            {module.renderer === "experience" ? (
              <li className="pt-2">
                <DemoSurfacesDropdown
                  productId={productId}
                  accent={module.accent.accent}
                  size="sm"
                  label="Probar demo"
                  className="w-full justify-center"
                  fallbackHref={`/?product=${productId}#planes`}
                />
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </header>
  );
}

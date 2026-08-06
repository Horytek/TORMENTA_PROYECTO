import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HorytekIcon } from "@/components/brand/HorytekIcon";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mode } from "../data/landing.data";
import { NAV_LINKS, SALES_WHATSAPP_URL } from "../data/landing.data";

interface HeaderProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPocket = mode === "pocket";
  const isEcommerce = mode === "ecommerce";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md transition-colors",
        isPocket
          ? "border-amber-500/30 bg-amber-500/5"
          : isEcommerce
            ? "border-teal-700/30 bg-teal-700/5"
            : "border-border/60 bg-background/80",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground"
          aria-label="Horytek — Inicio"
        >
          <HorytekIcon
            size={22}
            className={
              isPocket ? "text-amber-600" : isEcommerce ? "text-teal-700" : "text-primary"
            }
          />
          <span className="text-[15px] font-semibold tracking-tight">
            Horytek
            {isPocket && <span className="ml-1 text-amber-600">Pocket</span>}
            {isEcommerce && <span className="ml-1 text-teal-700">Ecommerce</span>}
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={onModeChange} />

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className={cn(
              "gap-1.5",
              isPocket && "bg-amber-600 hover:bg-amber-700",
              isEcommerce && "bg-teal-700 hover:bg-teal-800",
            )}
          >
            {isEcommerce ? (
              <Link to="/login?mode=ecommerce">
                Empezar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : isPocket ? (
              <Link to="/login">
                Empezar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <a href={SALES_WHATSAPP_URL} target="_blank" rel="noreferrer">
                Solicitar demo <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
          </Button>

          <button
            type="button"
            className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-landing-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileOpen && (
        <div
          id="mobile-landing-menu"
          className="border-t border-border/60 bg-background px-6 py-4 md:hidden"
        >
          <ul className="space-y-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-[14px] font-medium text-foreground/90 hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-[14px] font-medium text-foreground/90 hover:text-foreground"
              >
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tabs: { id: Mode; label: string; activeClass: string }[] = [
    { id: "standard", label: "ERP", activeClass: "bg-background text-foreground shadow-sm" },
    { id: "pocket", label: "Pocket", activeClass: "bg-amber-500 text-white shadow-sm" },
    { id: "ecommerce", label: "Ecommerce", activeClass: "bg-teal-700 text-white shadow-sm" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Cambiar producto Horytek"
      className="hidden items-center gap-0.5 rounded-full border border-border bg-secondary/50 p-0.5 sm:inline-flex"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={mode === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "num rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors",
            mode === t.id ? t.activeClass : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

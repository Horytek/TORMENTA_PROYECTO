import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { HorytekIcon } from "@/components/brand/HorytekIcon";
import { cn } from "@/lib/utils";
import { getProductTheme } from "./productThemes";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export type ProductAppBarProps = {
  productId: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  roleLabel?: string;
  showHome?: boolean;
  onLogout?: () => void;
  actions?: ReactNode;
  className?: string;
};

/** Barra adaptable al theme del producto — Horytek+producto | empresa | acciones. */
export function ProductAppBar({
  productId,
  companyName,
  companyLogoUrl,
  roleLabel,
  showHome = false,
  onLogout,
  actions,
  className,
}: ProductAppBarProps) {
  const theme = getProductTheme(productId);
  const company = companyName?.trim() || null;

  return (
    <header
      className={cn("sticky top-0 z-30 backdrop-blur-md", className)}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        backgroundColor: `${theme.surface}e6`,
        borderBottom: `1px solid ${theme.accent}33`,
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-5 md:px-6">
        <Link
          to={`/?product=${productId}`}
          className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2"
          aria-label={`Horytek ${theme.name}`}
        >
          <HorytekIcon size={22} style={{ color: theme.accent }} className="shrink-0" />
          <span className="truncate text-[13px] font-semibold tracking-tight sm:text-[14px]">
            Horytek{" "}
            <span style={{ color: theme.accent }}>{theme.name}</span>
          </span>
        </Link>

        {company || roleLabel ? (
          <>
            <span className="hidden h-4 w-px shrink-0 bg-black/10 sm:block" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {company ? (
                <>
                  {companyLogoUrl ? (
                    <img
                      src={companyLogoUrl}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                      style={{ boxShadow: `0 0 0 1.5px ${theme.accent}44` }}
                    />
                  ) : (
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: theme.accentSoft,
                        color: theme.accent,
                        boxShadow: `inset 0 0 0 1px ${theme.accent}33`,
                      }}
                      aria-hidden
                    >
                      {initials(company)}
                    </span>
                  )}
                  <div className="min-w-0">
                    {roleLabel ? (
                      <p
                        className="truncate text-[9px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: theme.accent }}
                      >
                        {roleLabel}
                      </p>
                    ) : null}
                    <p className="truncate text-[12px] font-medium leading-tight text-black/75 sm:text-[13px]">
                      {company}
                    </p>
                  </div>
                </>
              ) : roleLabel ? (
                <p
                  className="truncate text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: theme.accent }}
                >
                  {roleLabel}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {actions}
          {showHome ? (
            <Link
              to="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-black/45 transition-colors hover:bg-black/5 hover:text-foreground"
              aria-label="Inicio"
            >
              <Home className="h-4 w-4" />
            </Link>
          ) : null}
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-9 items-center rounded-lg px-2.5 text-[13px] font-medium text-black/50 transition-colors hover:bg-black/5 hover:text-foreground"
            >
              Salir
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

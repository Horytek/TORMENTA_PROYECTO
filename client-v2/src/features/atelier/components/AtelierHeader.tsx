import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { HorytekIcon } from "@/components/brand/HorytekIcon";
import { useAtelierAccount } from "../account";
import { ATELIER_COPY } from "../copy";
import { destForAtelierRole, desktopNavForAtelierRole } from "../session";
import { ATELIER_ACCENT, ATELIER_ROUTES } from "../tokens";
import { AccountColophon } from "./AccountColophon";
import { AtelierButton } from "./AtelierButton";

type AtelierHeaderProps = {
  /** Extra a la derecha (p.ej. Encargar en ficha pública). Nunca reemplaza la cuenta. */
  trailing?: ReactNode;
  /** Izquierda (hamburguesa de la mesa en móvil). */
  leading?: ReactNode;
  className?: string;
};

export function AtelierHeader({ trailing, leading, className }: AtelierHeaderProps) {
  const { role, me } = useAtelierAccount();
  const homeTo = role ? destForAtelierRole(role) : ATELIER_ROUTES.discover;
  const links = desktopNavForAtelierRole(role);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[var(--at-hairline)] bg-[color-mix(in_srgb,var(--at-offwhite)_92%,transparent)] backdrop-blur-md",
        className,
      )}
    >
      <div className="at-header-inner">
        {/* Zona izquierda — leading slot (hamburguesa admin) */}
        {leading ? <div className="at-header-leading">{leading}</div> : null}

        {/* Logo — mismo patrón ProductAppBar: icono + texto compacto */}
        <Link
          to={homeTo}
          className="at-focus flex shrink-0 items-center gap-1.5 text-[var(--at-ink)]"
          aria-label={ATELIER_COPY.brandLockup}
        >
          <HorytekIcon size={20} style={{ color: ATELIER_ACCENT }} className="shrink-0" />
          <span className="truncate text-[13px] font-semibold tracking-tight sm:text-[14px]">
            {ATELIER_COPY.brand}{" "}
            <span
              className="font-[550] tracking-[-0.02em]"
              style={{ fontFamily: "var(--at-serif)", color: ATELIER_ACCENT }}
            >
              {ATELIER_COPY.wordmark}
            </span>
          </span>
        </Link>

        {/* Zona central — nav de escritorio (oculto en móvil via CSS) */}
        {links.length ? (
          <nav className="at-header-nav" aria-label="Atelier">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn("at-top-link at-ui at-focus", isActive && "is-on")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : (
          <div className="at-header-nav-spacer" aria-hidden />
        )}

        {/* Zona derecha — trailing + cuenta (siempre visible) */}
        <div className="at-header-end">
          {trailing}
          {role ? (
            <AccountColophon role={role} me={me} />
          ) : !trailing ? (
            <AtelierButton variant="tertiary" size="sm" asChild>
              <Link to={ATELIER_ROUTES.login}>{ATELIER_COPY.login}</Link>
            </AtelierButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}

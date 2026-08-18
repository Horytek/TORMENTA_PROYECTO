import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAtelierAccount } from "../account";
import { ATELIER_COPY } from "../copy";
import { destForAtelierRole, desktopNavForAtelierRole } from "../session";
import { ATELIER_ROUTES } from "../tokens";
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
        "sticky top-0 z-50 border-b border-[var(--at-hairline)] bg-[color-mix(in_srgb,var(--at-offwhite)_78%,transparent)] backdrop-blur-md",
        className,
      )}
    >
      <div className="at-header-inner">
        {leading ? <div className="at-header-leading lg:hidden">{leading}</div> : null}

        {role ? (
          <div className="at-header-account md:hidden">
            <AccountColophon role={role} me={me} />
          </div>
        ) : null}

        <Link to={homeTo} className="at-header-mark at-focus truncate text-[var(--at-ink)]" aria-label={ATELIER_COPY.brandLockup}>
          <span className="at-ui at-brand-horytek">{ATELIER_COPY.brand}</span>
          <span className="at-display at-brand-atelier">{ATELIER_COPY.wordmark}</span>
        </Link>

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

        <div className="at-header-end">
          {trailing}
          {role ? (
            <div className="hidden md:block">
              <AccountColophon role={role} me={me} />
            </div>
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

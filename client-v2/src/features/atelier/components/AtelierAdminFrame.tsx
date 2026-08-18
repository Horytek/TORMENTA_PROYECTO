import { useEffect, useId, useState, type ReactNode } from "react";
import { NavLink, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ATELIER_COPY } from "../copy";
import { adminNavItems, getAtelierSession } from "../session";
import { ATELIER_ROUTES } from "../tokens";
import { AtelierHeader } from "./AtelierHeader";
import { AtelierRoot } from "./AtelierRoot";

const SIDEBAR_KEY = "atelier-admin-sidebar";

function IconResumen() {
  return (
    <svg viewBox="0 0 24 24" className="at-admin-ico" aria-hidden>
      <rect x="4" y="5" width="7" height="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="13" y="5" width="7" height="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="4" y="13" width="16" height="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconEncargos() {
  return (
    <svg viewBox="0 0 24 24" className="at-admin-ico" aria-hidden>
      <rect x="5" y="4" width="14" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 9h8M8 13h6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconUsuarios() {
  return (
    <svg viewBox="0 0 24 24" className="at-admin-ico" aria-hidden>
      <circle cx="12" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 19c1.2-3 3.4-4.5 6-4.5S16.8 16 18 19" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconComision() {
  return (
    <svg viewBox="0 0 24 24" className="at-admin-ico" aria-hidden>
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.7c0 2.3-5 1.4-5 3.6 0 1 .9 1.7 2.5 1.7 1.1 0 2-.5 2.5-1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

const ICONS = [IconResumen, IconEncargos, IconUsuarios, IconComision];

type AtelierAdminFrameProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="at-admin-ico" aria-hidden>
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      ) : (
        <path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
  );
}

function SidebarLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="at-admin-nav" aria-label="Mesa">
      {adminNavItems().map((item, i) => {
        const Icon = ICONS[i];
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
            className={({ isActive }) => cn("at-admin-link at-focus", isActive && "is-on")}
          >
            {Icon ? <Icon /> : null}
            <span className="at-admin-link-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/** Chrome de la mesa: mismo papel/tinta; sidebar solo aquí. */
export function AtelierAdminFrame({ title, subtitle, children }: AtelierAdminFrameProps) {
  const session = getAtelierSession();
  const drawerTitleId = useId();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "collapsed";
    } catch {
      return false;
    }
  });
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  if (!session || session.role !== "admin") {
    return <Navigate to={ATELIER_ROUTES.login} replace />;
  }

  return (
    <AtelierRoot className={cn("at-admin-root", collapsed && "is-collapsed")} padNav={false}>
      <AtelierHeader
        leading={
          <button
            type="button"
            className="at-admin-burger at-focus lg:hidden"
            aria-label={ATELIER_COPY.openMenu}
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <MenuGlyph open={false} />
          </button>
        }
      />

      <div className="at-admin-body">
        <aside className={cn("at-admin-sidebar", collapsed && "is-collapsed")}>
          <p className="at-eyebrow at-admin-kicker">{ATELIER_COPY.brandLockup}</p>
          <SidebarLinks collapsed={collapsed} />
          <button
            type="button"
            className="at-admin-collapse at-focus"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? ATELIER_COPY.expandMenu : ATELIER_COPY.collapseMenu}
            aria-label={collapsed ? ATELIER_COPY.expandMenu : ATELIER_COPY.collapseMenu}
          >
            <svg viewBox="0 0 24 24" className="at-admin-ico" aria-hidden>
              <path
                d={collapsed ? "M10 6l6 6-6 6" : "M14 6l-6 6 6 6"}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="at-admin-link-label">{collapsed ? ATELIER_COPY.expandMenu : ATELIER_COPY.collapseMenu}</span>
          </button>
        </aside>

        {drawer ? (
          <div className="at-admin-drawer lg:hidden" role="presentation">
            <button type="button" className="at-admin-drawer-scrim" aria-label="Cerrar" onClick={() => setDrawer(false)} />
            <div className="at-admin-drawer-panel" role="dialog" aria-modal="true" aria-labelledby={drawerTitleId}>
              <div className="at-admin-drawer-head">
                <p id={drawerTitleId} className="at-display text-2xl">
                  {ATELIER_COPY.mesa}
                </p>
                <button
                  type="button"
                  className="at-admin-burger at-focus"
                  aria-label="Cerrar"
                  onClick={() => setDrawer(false)}
                >
                  <MenuGlyph open />
                </button>
              </div>
              <SidebarLinks collapsed={false} onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        ) : null}

        <main className="at-admin-main">
          <header className="at-admin-pagehead">
            <p className="at-eyebrow">{ATELIER_COPY.mesa}</p>
            <h1 className="at-display at-admin-title">{title}</h1>
            {subtitle ? <p className="at-ui at-admin-dek">{subtitle}</p> : null}
          </header>
          {children}
        </main>
      </div>
    </AtelierRoot>
  );
}

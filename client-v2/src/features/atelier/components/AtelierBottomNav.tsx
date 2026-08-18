import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ATELIER_COPY } from "../copy";
import { ATELIER_ROUTES } from "../tokens";

export type AtelierNavItem = {
  to: string;
  label: string;
  end?: boolean;
  /** Sello/rosa central Encargar (cliente). */
  seal?: boolean;
};

const PUBLIC_ITEMS: AtelierNavItem[] = [
  { to: ATELIER_ROUTES.discover, label: ATELIER_COPY.explore, end: true },
  { to: ATELIER_ROUTES.artists, label: ATELIER_COPY.artists },
  { to: ATELIER_ROUTES.commission, label: ATELIER_COPY.commission, seal: true },
];

function EncargarSeal({ active }: { active: boolean }) {
  return (
    <span className={cn("at-seal", active && "is-on")}>
      <svg viewBox="0 0 64 64" className="at-seal-mark" aria-hidden>
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="32" cy="32" r="24.5" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.6 2.4" />
        <path
          d="M32 18c6 7 7 13 0 22c-7-9-6-15 0-22Zm0 6c4 3 5 7 0 13c-5-6-4-10 0-13Zm-9 7c8 1 13 5 17 13c-9-4-14-7-17-13Zm18 0c-8 1-13 5-17 13c9-4 14-7 17-13Z"
          fill="currentColor"
        />
      </svg>
      <span className="at-seal-word">{ATELIER_COPY.commission}</span>
    </span>
  );
}

type AtelierBottomNavProps = {
  items?: readonly AtelierNavItem[];
  className?: string;
};

/** Nav inferior editorial: tipo, no tab bar de iconos. Targets ≥44px + safe-area. */
export function AtelierBottomNav({ items = PUBLIC_ITEMS, className }: AtelierBottomNavProps) {
  return (
    <nav aria-label="Atelier móvil" className={cn("at-bottom-nav md:hidden", className)}>
      <ul
        className="at-bottom-nav-list"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <li key={`${item.to}-${item.label}`}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "at-bottom-nav-item at-focus",
                  item.seal && "is-seal",
                  isActive && "is-on",
                )
              }
            >
              {({ isActive }) =>
                item.seal ? (
                  <EncargarSeal active={isActive} />
                ) : (
                  <span className="at-bottom-nav-label">{item.label}</span>
                )
              }
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

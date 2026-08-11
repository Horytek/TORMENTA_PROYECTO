import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/mayorista-admin", label: "Pedidos", end: true },
  { to: "/mayorista-admin/portales", label: "Portales" },
  { to: "/mayorista-admin/listas", label: "Listas" },
  { to: "/mayorista-admin/compradores", label: "Compradores" },
];

/** Nav de la consola admin Mayorista. */
export function MayoristaAdminNav() {
  return (
    <nav className="-mx-1 flex flex-wrap gap-1 border-b border-black/8 pb-3">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            cn(
              "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-[var(--platform-accent)] text-white"
                : "text-black/55 hover:bg-black/5 hover:text-foreground"
            )
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

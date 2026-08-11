import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/taxi-admin", label: "Viajes", end: true },
  { to: "/taxi-admin/conductores", label: "Conductores" },
  { to: "/taxi-admin/pasajeros", label: "Pasajeros" },
  { to: "/taxi-admin/equipo", label: "Equipo" },
  { to: "/taxi-admin/operador", label: "Operador" },
];

/** Nav de la consola admin Taxi. */
export function TaxiAdminNav() {
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

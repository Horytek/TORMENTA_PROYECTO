import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/delivery-admin", label: "Pedidos", end: true },
  { to: "/delivery-admin/repartidores", label: "Repartidores" },
  { to: "/delivery-admin/clientes", label: "Clientes" },
  { to: "/delivery-admin/equipo", label: "Equipo" },
  { to: "/delivery-admin/operador", label: "Operador" },
];

/** Nav de la consola admin Delivery. */
export function DeliveryAdminNav() {
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

import type { ReactNode } from "react";
import { NavLink, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import {
  getAtelierAdminToken,
  getAtelierClienteToken,
  getAtelierCreadorToken,
  setAtelierAdminToken,
  setAtelierClienteToken,
  setAtelierCreadorToken,
} from "@/features/platform/api/atelier";

type Kind = "cliente" | "creador" | "admin";

const LINKS: Record<Kind, { to: string; label: string; end?: boolean }[]> = {
  cliente: [
    { to: "/atelier/cliente", label: "Resumen", end: true },
    { to: "/atelier/cliente/solicitudes", label: "Solicitudes" },
    { to: "/atelier/cliente/pedidos", label: "Pedidos" },
    { to: "/atelier/cliente/favoritos", label: "Favoritos" },
  ],
  creador: [
    { to: "/atelier/creador", label: "Resumen", end: true },
    { to: "/atelier/creador/solicitudes", label: "Solicitudes" },
    { to: "/atelier/creador/pedidos", label: "Pedidos" },
    { to: "/atelier/creador/servicios", label: "Servicios" },
    { to: "/atelier/creador/portafolio", label: "Portafolio" },
    { to: "/atelier/creador/ganancias", label: "Ganancias" },
  ],
  admin: [
    { to: "/atelier-admin", label: "Resumen", end: true },
    { to: "/atelier-admin/pedidos", label: "Pedidos" },
    { to: "/atelier-admin/usuarios", label: "Usuarios" },
    { to: "/atelier-admin/comision", label: "Comisión" },
  ],
};

function token(kind: Kind) {
  return kind === "admin"
    ? getAtelierAdminToken()
    : kind === "creador"
      ? getAtelierCreadorToken()
      : getAtelierClienteToken();
}

function clear(kind: Kind) {
  if (kind === "admin") setAtelierAdminToken(null);
  else if (kind === "creador") setAtelierCreadorToken(null);
  else setAtelierClienteToken(null);
}

/** Nav de tabs con identidad Atelier — acento rosa activo, borde hairline. */
function AtelierPlatformNav({ kind }: { kind: Kind }) {
  return (
    <nav
      className="-mx-1 flex flex-wrap gap-1 border-b pb-3"
      style={{ borderColor: "rgb(44 40 36 / 0.12)" }}
    >
      {LINKS[kind].map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            cn(
              "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              isActive ? "" : "hover:bg-black/5",
            )
          }
          style={({ isActive }) =>
            isActive
              ? { backgroundColor: "#DB2777", color: "#fff8fb" }
              : { color: "rgb(138 130 120)" }
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AtelierShell({
  kind,
  title,
  subtitle,
  children,
}: {
  kind: Kind;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  if (!token(kind)) return <Navigate to="/login?mode=atelier" replace />;
  return (
    <PlatformShell
      productId="atelier"
      title={title}
      subtitle={subtitle}
      roleLabel={kind === "admin" ? "Admin" : kind === "creador" ? "Creador" : "Cliente"}
      companyName="Atelier"
      homeHref="/atelier"
      onLogout={() => {
        clear(kind);
        window.location.assign("/login?mode=atelier");
      }}
    >
      <AtelierPlatformNav kind={kind} />
      {children}
    </PlatformShell>
  );
}

export const AtelierClienteShell = (
  p: Omit<Parameters<typeof AtelierShell>[0], "kind">,
) => <AtelierShell kind="cliente" {...p} />;

export const AtelierCreadorShell = (
  p: Omit<Parameters<typeof AtelierShell>[0], "kind">,
) => <AtelierShell kind="creador" {...p} />;

export const AtelierAdminShell = (
  p: Omit<Parameters<typeof AtelierShell>[0], "kind">,
) => <AtelierShell kind="admin" {...p} />;

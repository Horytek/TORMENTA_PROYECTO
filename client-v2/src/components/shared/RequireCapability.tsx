import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface RequireCapabilityProps {
  /** capability completa, ej. "configuracion/roles.view". Omitir si `developerOnly`. */
  capability?: string;
  /** El panel Developer no tiene módulo/capability en BD — se exige id_rol=10 directo. */
  developerOnly?: boolean;
  /** Pantallas sin módulo en BD gateadas por rol admin del tenant (ej. logs de auditoría). */
  adminOnly?: boolean;
  children: ReactNode;
}

/**
 * Guard de ruta a nivel de React Router. Antes, la única protección de rutas
 * sensibles (/settings/roles, /settings/system, /developer) era que el
 * sidebar no mostraba el link — cualquier usuario autenticado que conociera
 * la URL podía navegar directo. Esto complementa (no reemplaza) la
 * autorización real ya agregada en el backend (Fase 1).
 */
export function RequireCapability({ capability, developerOnly, adminOnly, children }: RequireCapabilityProps) {
  const { can, isDeveloper, isAdmin } = usePermissions();

  const isCompanySetting = capability?.startsWith("configuracion/negocio") || capability?.startsWith("configuracion/empresa");
  const isCatalogo = capability === "catalogo.view" || capability?.startsWith("catalogo.");

  const allowed = developerOnly
    ? isDeveloper
    : adminOnly
      ? isAdmin
      : capability
        ? isDeveloper ||
          (isCompanySetting && isAdmin) ||
          (isCatalogo && isAdmin) ||
          can(capability) ||
          (isCompanySetting &&
            (can("configuracion/negocio.ver") ||
              can("configuracion/negocio.editar") ||
              can("configuracion/empresa.ver") ||
              can("configuracion/empresa.view")))
        : true;

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Acceso restringido</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No tienes permiso para ver esta sección. Si crees que es un error, contacta a un administrador.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

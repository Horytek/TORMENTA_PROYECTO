import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AtelierChrome } from "./AtelierRoot";
import {
  destForAtelierRole,
  getAtelierSession,
  navForAtelierRole,
} from "../session";
import { ATELIER_ROUTES } from "../tokens";

type ProductFrameProps = {
  children: ReactNode;
  /** Si se indica, exige JWT de ese rol (admin no entra al producto). */
  requireRole?: "cliente" | "creador";
  className?: string;
  /** Extra a la derecha del header; no pisa el avatar de cuenta. */
  trailing?: ReactNode;
};

/** Chrome autenticado. Nunca PlatformShell. La cuenta vive en el header. */
export function AtelierProductFrame({ children, requireRole, className, trailing }: ProductFrameProps) {
  const session = getAtelierSession();

  if (requireRole && !session) {
    return <Navigate to={ATELIER_ROUTES.login} replace />;
  }
  if (requireRole && session && session.role !== requireRole) {
    if (session.role === "admin") return <Navigate to={ATELIER_ROUTES.admin} replace />;
    return <Navigate to={destForAtelierRole(session.role)} replace />;
  }

  const role = session?.role === "admin" ? undefined : session?.role;
  return (
    <AtelierChrome
      className={className}
      trailing={trailing}
      bottomNavItems={navForAtelierRole(role)}
    >
      {children}
    </AtelierChrome>
  );
}

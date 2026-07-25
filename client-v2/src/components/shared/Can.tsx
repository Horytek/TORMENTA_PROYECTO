import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Guard declarativo a nivel de elemento (Fase 5.1 de PLAN_PERMISOS_PLAN_ROLES.md).
 *
 * Reemplaza el patrón disperso `const canX = can("slug.accion"); … {canX && <Button/>}`
 * por un único componente. Acepta capabilities ESTÁNDAR ("productos.edit") y
 * DINÁMICAS ("pos.change_warehouse", "ventas.anular_venta"), así que agregar una
 * acción nueva al catálogo del backend la habilita acá sin tocar más código:
 * el permiso se envuelve, no se hardcodea.
 *
 * Uso:
 *   // Ocultar si no tiene permiso (default):
 *   <Can capability="nota_almacen.create"><Button>Nueva nota</Button></Can>
 *
 *   // Deshabilitar en vez de ocultar (children como función):
 *   <Can capability="nota_almacen.edit">{(ok) => <Button disabled={!ok}>Editar</Button>}</Can>
 *
 *   // Mostrar un fallback (ej. hint de "mejora tu plan"):
 *   <Can capability="contabilidad.view" fallback={<UpgradeHint/>}>…</Can>
 *
 *   // Combos: basta una (anyOf) o todas (allOf):
 *   <Can anyOf={["ventas.edit", "ventas.delete"]}>…</Can>
 */
interface CanProps {
  /** Capability completa, ej. "productos.edit" o dinámica "pos.change_warehouse". */
  capability?: string;
  /** Permitido si tiene AL MENOS UNA de estas. */
  anyOf?: string[];
  /** Permitido si tiene TODAS estas. */
  allOf?: string[];
  /** Qué renderizar cuando NO tiene permiso. Default: nada (oculto). */
  fallback?: ReactNode;
  /** Nodo (se oculta si no hay permiso) o función `(allowed) => nodo` (para deshabilitar). */
  children: ReactNode | ((allowed: boolean) => ReactNode);
}

/** Resuelve el permiso según capability / anyOf / allOf. Developer siempre pasa (vía `can`). */
function resolveAllowed(
  can: (perm: string) => boolean,
  { capability, anyOf, allOf }: Pick<CanProps, "capability" | "anyOf" | "allOf">
): boolean {
  if (capability) return can(capability);
  if (anyOf && anyOf.length) return anyOf.some((c) => can(c));
  if (allOf && allOf.length) return allOf.every((c) => can(c));
  return true; // sin condición = visible
}

export function Can({ capability, anyOf, allOf, fallback = null, children }: CanProps) {
  const { can } = usePermissions();
  const allowed = resolveAllowed(can, { capability, anyOf, allOf });

  if (typeof children === "function") return <>{children(allowed)}</>;
  return <>{allowed ? children : fallback}</>;
}

/** Versión hook para lógica (no-JSX): `const canEdit = useCan("productos.edit")`. */
export function useCan(capability?: string): boolean {
  const { can } = usePermissions();
  return capability ? can(capability) : true;
}

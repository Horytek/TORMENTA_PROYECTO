import { useUserStore } from "@/store/useUserStore";

/** id_rol reservado para el usuario Developer/SuperAdmin. Antes este literal
 * estaba repetido a mano en ~26 sitios de client-v2; ahora vive en un solo lugar. */
export const DEVELOPER_ROLE_ID = 10;

/** id_rol reservado para el Administrador de cada tenant (asignado al crear la empresa). */
export const ADMIN_ROLE_ID = 1;

/** Roles que no deben asignarse desde el selector de roles (owner y developer). */
export const RESERVED_ROLE_IDS = [ADMIN_ROLE_ID, DEVELOPER_ROLE_ID];

/**
 * Centraliza el patrón `user?.roleId === 10 || capabilities.has(perm) || capabilities.has("*")`
 * repetido en 14+ archivos de client-v2 (AppSidebar, RolesPage, BranchesPage, etc.).
 */
export function usePermissions() {
  const roleId = useUserStore((s) => s.user?.roleId);
  const capabilities = useUserStore((s) => s.capabilities);

  const isDeveloper = roleId === DEVELOPER_ROLE_ID;
  const isAdmin = isDeveloper || roleId === ADMIN_ROLE_ID;

  const can = (perm: string): boolean => {
    if (isDeveloper) return true;
    return capabilities.has(perm) || capabilities.has("*");
  };

  return { can, isDeveloper, isAdmin, capabilities, roleId };
}

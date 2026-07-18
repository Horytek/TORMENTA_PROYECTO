import api from "./axios";

export type PermissionSource = "DEFAULT_PLAN" | "TENANT_OVERRIDE";

export interface EffectivePermissions {
  capabilities: string[];
  sources: Record<string, PermissionSource>;
}

/**
 * Capabilities efectivas de un rol: default del plan + override del tenant
 * (el override siempre gana por recurso — ver src/services/authz.service.js).
 * Única fuente que debería usarse para calcular qué puede ver/hacer un rol.
 */
export const getEffectivePermissions = async (roleId: number): Promise<EffectivePermissions> => {
  const res = await api.get(`/authz/roles/${roleId}/effective`);
  return res.data?.data ?? { capabilities: [], sources: {} };
};

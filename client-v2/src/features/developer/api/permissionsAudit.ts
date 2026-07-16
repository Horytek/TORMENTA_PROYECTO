import api from "@/api/axios";
import { unwrapList } from "@/api/http";

export interface PlanOption {
  id_plan: number;
  descripcion_plan: string;
}

export interface RoleOption {
  id_rol: number;
  nom_rol: string;
}

export interface MergedPermissionNode {
  uniqueId: string;
  type: "modulo" | "submodulo";
  id: number;
  name: string;
  availableActions: string[];
  permissions: Record<string, boolean>;
  children?: MergedPermissionNode[];
}

export const getPlanesDisponibles = async (): Promise<PlanOption[]> =>
  unwrapList<PlanOption>(await api.get("/permisos-globales/planes"));

export const getRolesPorPlan = async (): Promise<RoleOption[]> =>
  unwrapList<RoleOption>(await api.get("/permisos-globales/roles-plan"));

/** Árbol módulo→submódulo con acciones disponibles + permisos fusionados
 * (columnas fijas + `actions_json`) para un rol y plan dados. Consume el
 * endpoint `permissions.v2.controller.js`, ya construido pero sin usar
 * desde ningún frontend hasta ahora. */
export const getUnifiedCatalog = async (roleId: number, planId: number): Promise<MergedPermissionNode[]> => {
  const response = await api.get("/permisos-globales/v2/unified-catalog", {
    params: { roleId, planId },
  });
  const data = response.data;
  return data?.data || (Array.isArray(data) ? data : []);
};

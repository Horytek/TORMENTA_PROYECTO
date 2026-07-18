import api from "@/api/axios";
import type {
  Modulo, Submodulo, ModuloInput, ModuloUpdateInput, SubmoduloInput,
  PlatformUser, Empresa, NewUserInput, UpdateUserPlanInput,
  CatalogAction, CatalogActionInput, Plan, PlanTemplateVersion, PlanEntitlements,
} from "../types";

// ─────────────────────────────────────────────────────────────────
// Módulos y submódulos (estructura de menú)
// ─────────────────────────────────────────────────────────────────

export const getModulos = async (): Promise<{ modulos: Modulo[]; submodulos: Submodulo[] }> => {
  const res = await api.get("/modulos/");
  if (!res.data?.success) throw new Error(res.data?.message || "Error al obtener los módulos");
  return { modulos: res.data.data.modulos ?? [], submodulos: res.data.data.submodulos ?? [] };
};

export const createModulo = async (input: ModuloInput): Promise<boolean> => {
  const res = await api.post("/modulos/", input);
  return res.data?.code === 1;
};

export const updateModulo = async (id: number, input: ModuloUpdateInput): Promise<boolean> => {
  const res = await api.put(`/modulos/${id}`, input);
  return res.data?.code === 1 || res.status === 200;
};

export const deleteModulo = async (id: number): Promise<void> => {
  await api.delete(`/modulos/${id}`);
};

/** Toggle rápido de "visible en menú" sin abrir el formulario completo. */
export const setModuloVisibility = async (modulo: Modulo, is_visible: boolean): Promise<boolean> => {
  const res = await api.put(`/modulos/${modulo.id_modulo}`, {
    nombre_modulo: modulo.nombre_modulo,
    ruta: modulo.ruta,
    is_visible,
  });
  return res.data?.code === 1 || res.status === 200;
};

export const createSubmodulo = async (input: SubmoduloInput): Promise<boolean> => {
  const res = await api.post("/modulos/submodulos/", input);
  return res.data?.code === 1;
};

export const updateSubmodulo = async (id: number, input: Omit<SubmoduloInput, "id_modulo">): Promise<boolean> => {
  const res = await api.put(`/submodulos/${id}`, input);
  return res.data?.code === 1 || res.status === 200;
};

export const deleteSubmodulo = async (id: number): Promise<void> => {
  await api.delete(`/submodulos/${id}`);
};

/** Toggle rápido de "visible en menú" sin abrir el formulario completo. */
export const setSubmoduloVisibility = async (submodulo: Submodulo, is_visible: boolean): Promise<boolean> => {
  const res = await api.put(`/submodulos/${submodulo.id_submodulo}`, {
    nombre_sub: submodulo.nombre_sub,
    ruta: submodulo.ruta_submodulo,
    is_visible,
  });
  return res.data?.code === 1 || res.status === 200;
};

// ─────────────────────────────────────────────────────────────────
// Usuarios administradores (id_rol=1) y planes — vista SaaS multi-tenant
// ─────────────────────────────────────────────────────────────────

export const getPlatformUsers = async (): Promise<PlatformUser[]> => {
  const res = await api.get("/usuario");
  const data = res.data?.data ?? res.data;
  const list: any[] = Array.isArray(data) ? data : [];
  return list
    .filter((u) => String(u.id_rol) === "1")
    .map((u) => ({
      ...u,
      plan_pago: u.plan_pago_1 || "basic",
      estado_usuario_1: u.estado_usuario ?? 0,
    }));
};

export const getEmpresasList = async (): Promise<Empresa[]> => {
  const res = await api.get("/empresa");
  return res.data?.data ?? [];
};

export const createPlatformUser = async (input: NewUserInput): Promise<boolean> => {
  const res = await api.post("/usuario", input);
  return res.data?.code === 1;
};

export const deletePlatformUser = async (id: number): Promise<void> => {
  await api.delete(`/usuario/${id}`);
};

export const updateUserPlan = async (id: number, input: UpdateUserPlanInput): Promise<boolean> => {
  const res = await api.put(`/usuario/plan/${id}`, input);
  return res.data?.code === 1 || res.status === 200;
};

// ─────────────────────────────────────────────────────────────────
// Catálogo de acciones globales (para permisos)
// ─────────────────────────────────────────────────────────────────

export const getActions = async (): Promise<CatalogAction[]> => {
  const res = await api.get("/developer/actions");
  return res.data?.data ?? [];
};

export const createAction = async (input: CatalogActionInput): Promise<boolean> => {
  const res = await api.post("/developer/actions", input);
  return res.data?.code === 1;
};

export const updateAction = async (id: number, input: CatalogActionInput): Promise<boolean> => {
  const res = await api.put(`/developer/actions/${id}`, input);
  return res.data?.code === 1;
};

export const deleteAction = async (id: number): Promise<boolean> => {
  const res = await api.delete(`/developer/actions/${id}`);
  return res.data?.code === 1;
};

// ─────────────────────────────────────────────────────────────────
// Plantillas de plan (entitlements versionados — E4/E5 nueva_arquitectura.md)
// ─────────────────────────────────────────────────────────────────

export const getPlanes = async (): Promise<Plan[]> => {
  const res = await api.get("/planes");
  return res.data?.data ?? [];
};

export const listPlanVersions = async (idPlan: number): Promise<PlanTemplateVersion[]> => {
  const res = await api.get(`/plan-templates/${idPlan}/versions`);
  return res.data?.data ?? [];
};

export const getPlanEntitlements = async (templateVersionId: number): Promise<PlanEntitlements> => {
  const res = await api.get(`/plan-templates/${templateVersionId}/entitlements`);
  return res.data?.data ?? { modulos: [], submodulos: [] };
};

export const createPlanDraft = async (idPlan: number): Promise<{ id: number; version: number }> => {
  const res = await api.post("/plan-templates/draft", { id_plan: idPlan });
  if (!res.data?.success) throw new Error(res.data?.message || "No se pudo crear el borrador");
  return { id: res.data.id, version: res.data.version };
};

export const savePlanEntitlements = async (templateVersionId: number, entitlements: PlanEntitlements): Promise<boolean> => {
  const res = await api.put(`/plan-templates/${templateVersionId}/entitlements`, entitlements);
  return !!res.data?.success;
};

export const publishPlanVersion = async (templateVersionId: number): Promise<boolean> => {
  const res = await api.post(`/plan-templates/${templateVersionId}/publish`);
  return !!res.data?.success;
};

export const discardPlanDraft = async (templateVersionId: number): Promise<boolean> => {
  const res = await api.delete(`/plan-templates/${templateVersionId}`);
  return !!res.data?.success;
};

// ─────────────────────────────────────────────────────────────────
// Limpiador de base de datos (herramienta destructiva, solo developer)
// ─────────────────────────────────────────────────────────────────

export interface ClearTenantDataResult {
  success: boolean;
  message?: string;
  /** Pasos que se saltaron por falta de tabla/columna en esta BD (diagnóstico, no error). */
  skipped?: string[];
}

export const clearTenantData = async (targetTenantId: number | string): Promise<ClearTenantDataResult> => {
  try {
    const res = await api.delete("/developer/clear-data", { data: { password: "dev1234", target_tenant_id: targetTenantId } });
    return { success: res.data?.code === 1, message: res.data?.message, skipped: res.data?.skipped ?? [] };
  } catch (err) {
    const data = (err as { response?: { data?: { message?: string; step?: string; skipped?: string[] } } })?.response?.data;
    const message = data?.step ? `${data.message} (paso: ${data.step})` : data?.message;
    return { success: false, message: message || "Error de conexión o servidor", skipped: data?.skipped ?? [] };
  }
};

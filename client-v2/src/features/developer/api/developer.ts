import api from "@/api/axios";
import type {
  Modulo, Submodulo, ModuloInput, SubmoduloInput,
  PlatformUser, Empresa, NewUserInput, UpdateUserPlanInput,
  CatalogAction, CatalogActionInput,
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

export const updateModulo = async (id: number, input: ModuloInput): Promise<boolean> => {
  const res = await api.put(`/modulos/${id}`, input);
  return res.data?.code === 1 || res.status === 200;
};

export const deleteModulo = async (id: number): Promise<void> => {
  await api.delete(`/modulos/${id}`);
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
// Limpiador de base de datos (herramienta destructiva, solo developer)
// ─────────────────────────────────────────────────────────────────

export const clearTenantData = async (targetTenantId: number | string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.delete("/developer/clear-data", { data: { password: "dev1234", target_tenant_id: targetTenantId } });
    return { success: res.data?.code === 1, message: res.data?.message };
  } catch (err) {
    const data = (err as { response?: { data?: { message?: string; step?: string } } })?.response?.data;
    const message = data?.step ? `${data.message} (paso: ${data.step})` : data?.message;
    return { success: false, message: message || "Error de conexión o servidor" };
  }
};

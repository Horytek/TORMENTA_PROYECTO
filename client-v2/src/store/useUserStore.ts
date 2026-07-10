import { create } from "zustand";
import { getModulosConSubmodulos } from "../api/rutas";
import { getPermisosByRolRequest } from "../api/permisos";

export interface User {
  id: number | null;
  username: string;
  roleId: number | null;
  sucursal: string;
  id_tenant: number | null;
  id_empresa: number | null;
  plan_pago: string;
  original: any;
}

export interface Permission {
  id_modulo: number;
  id_submodulo: number | null;
  modulo_ruta: string;
  submodulo_ruta: string | null;
  ver: number;
  crear: number;
  editar: number;
  eliminar: number;
  desactivar: number;
  generar: number;
}

export interface ModuleConfig {
  id: number;
  nombre_modulo: string;
  ruta: string;
  active_actions?: string | string[];
  submodulos?: {
    id_submodulo: number;
    nombre_submodulo: string;
    ruta: string;
    active_actions?: string | string[];
  }[];
}

interface UserState {
  // Legacy fields kept for compatibility if needed
  nombre: string;
  usuario: string;
  rol: number | string;
  sur: string;
  almacen: string;
  id_tenant: number | string;
  id_empresa: number | string;
  plan_pago: string;
  permissions: Permission[];
  capabilities: Set<string>;
  globalModuleConfigs: ModuleConfig[];
  
  // Normalized User object
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;

  // Actions
  setNombre: (nombre: string) => void;
  setUsuario: (usuario: string) => void;
  setIdRol: (rol: number) => void;
  setSur: (sur: string) => void;
  setAlmacen: (almacen: string) => void;
  setIdTenant: (id_tenant: number) => void;
  setIdEmpresa: (id_empresa: number) => void;
  setPlanPago: (plan_pago: string) => void;
  setPermissions: (permissions: Permission[]) => void;
  setCapabilities: (capabilities: string[] | Set<string>) => void;
  setGlobalModuleConfigs: (configs: ModuleConfig[]) => void;
  setUserRaw: (raw: any) => void;
  setLoading: (loading: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  clearUser: () => void;
  loadPermissionsAndCapabilities: (roleId: number) => Promise<void>;
}

const normalizeUser = (raw: any): User | null => {
  if (!raw || typeof raw !== "object") return null;
  const roleId = parseInt(
    raw.roleId ??
    raw.rol ??
    raw.id_rol ??
    raw.role ??
    raw.idRol ??
    raw.idRole
  ) || null;

  const username =
    raw.usuario ??
    raw.usua ??
    raw.nameUser ??
    raw.username ??
    raw.name ??
    "";

  return {
    id: raw.id_usuario || raw.id || null,
    username,
    roleId,
    sucursal: raw.sucursal || raw.nombre_sucursal || raw.sur || "",
    id_tenant: raw.id_tenant || raw.idTenant || null,
    id_empresa: raw.id_empresa || raw.idEmpresa || null,
    plan_pago: raw.plan_pago || raw.planPago || null,
    original: raw
  };
};

const getActiveActions = (globalConfigs: any[], idModulo: number, idSubmodulo: number | null) => {
  // `null` = sin restricción → se permiten las acciones que el permiso del rol concede.
  // Un array (aunque vacío) sí restringe a esa lista exacta.
  if (!globalConfigs.length) return null;
  const moduleConfig = globalConfigs.find(m => String(m.id) === String(idModulo));
  if (!moduleConfig) return null;
  if (idSubmodulo && idSubmodulo !== 0) {
    const subConfig = moduleConfig.submodulos?.find((s: any) => String(s.id_submodulo) === String(idSubmodulo));
    return subConfig?.active_actions ?? null;
  }
  return moduleConfig.active_actions ?? null;
};

const parseActions = (actions: any) => {
  if (!actions) return null;
  if (Array.isArray(actions)) return actions;
  if (typeof actions === 'string') {
    try { return JSON.parse(actions); } catch { return []; }
  }
  return [];
};

export const useUserStore = create<UserState>((set) => ({
  nombre: "",
  usuario: "",
  rol: "",
  sur: "",
  almacen: "",
  id_tenant: "",
  id_empresa: "",
  plan_pago: "",
  permissions: [],
  capabilities: new Set<string>(),
  globalModuleConfigs: [],
  user: null,
  isAuthenticated: false,
  loading: true,

  setNombre: (nombre) => set({ nombre }),
  setUsuario: (usuario) => set({ usuario }),
  setIdRol: (rol) => set({ rol }),
  setSur: (sur) => set({ sur }),
  setAlmacen: (almacen) => set({ almacen }),
  setIdTenant: (id_tenant) => set({ id_tenant }),
  setIdEmpresa: (id_empresa) => set({ id_empresa }),
  setPlanPago: (plan_pago) => set({ plan_pago }),
  setPermissions: (permissions) => set({ permissions }),
  setCapabilities: (capabilities) => set({ 
    capabilities: capabilities instanceof Set ? capabilities : new Set(capabilities) 
  }),
  setGlobalModuleConfigs: (configs) => set({ globalModuleConfigs: configs }),
  setLoading: (loading) => set({ loading }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setUserRaw: (raw) => {
    const u = normalizeUser(raw);
    if (!u) {
      set({
        user: null,
        isAuthenticated: false,
        nombre: "",
        usuario: "",
        rol: "",
        sur: "",
        id_tenant: "",
        id_empresa: "",
        plan_pago: ""
      });
      return;
    }
    set({
      user: u,
      isAuthenticated: true,
      nombre: u.username,
      usuario: u.username,
      rol: u.roleId ?? "",
      sur: u.sucursal,
      id_tenant: u.id_tenant ?? "",
      id_empresa: u.id_empresa ?? "",
      plan_pago: u.plan_pago || ""
    });
  },

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      nombre: "",
      usuario: "",
      rol: "",
      sur: "",
      almacen: "",
      id_tenant: "",
      id_empresa: "",
      plan_pago: "",
      permissions: [],
      capabilities: new Set<string>(),
      globalModuleConfigs: []
    }),

  loadPermissionsAndCapabilities: async (roleId) => {
    try {
      const globalConfigs = await getModulosConSubmodulos();
      const permResponse = await getPermisosByRolRequest(roleId);
      const permissionsList = permResponse.data?.data || permResponse.data || [];
      
      const caps = new Set<string>();
      
      if (Array.isArray(permissionsList)) {
        permissionsList.forEach((p: any) => {
          const slug = p.submodulo_ruta || p.modulo_ruta;
          if (!slug) return;
          let base = slug.toLowerCase();
          if (base.startsWith("/")) {
            base = base.substring(1);
          }
          
          const rawActive = getActiveActions(globalConfigs, p.id_modulo, p.id_submodulo);
          const activeActions = parseActions(rawActive);
          
          const isAllowed = (action: string) => {
            if (activeActions === null) return true;
            return activeActions.includes(action);
          };
          
          if (p.ver && isAllowed('ver')) caps.add(`${base}.view`);
          if (p.crear && isAllowed('crear')) caps.add(`${base}.create`);
          if (p.editar && isAllowed('editar')) caps.add(`${base}.edit`);
          if (p.eliminar && isAllowed('eliminar')) caps.add(`${base}.delete`);
          if (p.desactivar && isAllowed('desactivar')) caps.add(`${base}.deactivate`);
          if (p.generar && isAllowed('generar')) caps.add(`${base}.generate`);
        });
      }
      
      set({ 
        permissions: permissionsList,
        globalModuleConfigs: globalConfigs,
        capabilities: caps
      });
    } catch (err) {
      console.error("Error loading permissions and capabilities:", err);
    }
  }
}));

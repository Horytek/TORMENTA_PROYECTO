import { create } from "zustand";
import { getModulosConSubmodulos, type RouteModule } from "../api/rutas";
import { getEffectivePermissions } from "../api/authz";

export interface User {
  id: number | null;
  username: string;
  roleId: number | null;
  sucursal: string;
  id_sucursal?: number | null;
  id_tenant: number | null;
  id_empresa: number | null;
  plan_pago: string;
  original: any;
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
  capabilities: Set<string>;
  globalModuleConfigs: RouteModule[];
  
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
    id_sucursal: raw.id_sucursal || raw.idSucursal || null,
    id_tenant: raw.id_tenant || raw.idTenant || null,
    id_empresa: raw.id_empresa || raw.idEmpresa || null,
    plan_pago: raw.plan_pago || raw.planPago || null,
    original: raw
  };
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
  setCapabilities: (capabilities) => set({
    capabilities: capabilities instanceof Set ? capabilities : new Set(capabilities) 
  }),
  setGlobalModuleConfigs: (configs) => set({ globalModuleConfigs: configs as unknown as RouteModule[] }),
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
      capabilities: new Set<string>(),
      globalModuleConfigs: []
    }),

  loadPermissionsAndCapabilities: async (roleId) => {
    try {
      const [globalConfigs, effective] = await Promise.all([
        getModulosConSubmodulos(),
        getEffectivePermissions(roleId),
      ]);

      set({
        globalModuleConfigs: globalConfigs,
        capabilities: new Set(effective.capabilities),
      });
    } catch (err) {
      console.error("Error loading permissions and capabilities:", err);
    }
  }
}));

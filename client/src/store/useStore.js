import { create } from "zustand";

const normalizeUser = (raw) => {
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
    plan_pago: raw.plan_pago || raw.planPago || null, // <-- Añadido aquí
    original: raw
  };
};

export const useUserStore = create((set) => ({
  // Campos “legacy” usados en muchos componentes
  nombre: "",
  usuario: "",
  rol: "",
  sur: "",
  almacen: "",
  id_tenant: "",  id_empresa: "",  plan_pago: "", // <-- Añadido aquí
  permissions: [], // <-- Cache de permisos
  capabilities: new Set(), // <-- Set unificado de strings
  globalModuleConfigs: [], // <-- Stores active_actions for all modules
  // Nuevo objeto normalizado
  user: null,

  // Setters legacy (se mantienen por compatibilidad)
  setNombre: (nombre) => set({ nombre }),
  setUsuario: (usuario) => set({ usuario }),
  setIdRol: (rol) => set({ rol }),
  setSur: (sur) => set({ sur }),
  setAlmacen: (almacen) => set({ almacen }),
  setIdTenant: (id_tenant) => set({ id_tenant }),
  setIdEmpresa: (id_empresa) => set({ id_empresa }),
  setPlanPago: (plan_pago) => set({ plan_pago }),
  setPermissions: (permissions) => set({ permissions }),
  setPermissions: (permissions) => set({ permissions }),
  setCapabilities: (capabilities) => set({ capabilities: new Set(capabilities) }), // Accepts Array or Set
  setGlobalModuleConfigs: (configs) => set({ globalModuleConfigs: configs }),

  // NUEVO: asignar usuario crudo y normalizar
  setUserRaw: (raw) => {
    const u = normalizeUser(raw);
    if (!u) {
      set({
        user: null,
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
      nombre: u.username,
      usuario: u.username,
      rol: u.roleId,
      sur: u.sucursal,
      id_tenant: u.id_tenant,
      id_empresa: u.id_empresa,
      plan_pago: u.plan_pago || ""
    });
  },

  // Ya no se usa sessionStorage para hidratar usuario
  hydrateFromSession: () => {
    // No hace nada, se mantiene por compatibilidad
    return;
  },

  clearUser: () =>
    set({
      user: null,
      nombre: "",
      usuario: "",
      rol: "",
      sur: "",
      almacen: "",
      id_tenant: "",
      id_empresa: "",
      plan_pago: "",
      permissions: [],
      capabilities: new Set(),
      globalModuleConfigs: []
    })
}));
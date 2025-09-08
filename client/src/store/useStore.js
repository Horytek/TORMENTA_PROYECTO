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
  id_tenant: "",
  // Nuevo objeto normalizado
  user: null,

  // Setters legacy (se mantienen por compatibilidad)
  setNombre: (nombre) => set({ nombre }),
  setUsuario: (usuario) => set({ usuario }),
  setIdRol: (rol) => set({ rol }),
  setSur: (sur) => set({ sur }),
  setAlmacen: (almacen) => set({ almacen }),
  setIdTenant: (id_tenant) => set({ id_tenant }),

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
        id_tenant: ""
      });
      return;
    }
    set({
      user: u,
      nombre: u.username,
      usuario: u.username,
      rol: u.roleId,
      sur: u.sucursal,
      id_tenant: u.id_tenant
    });
  },

  // Rehidratación desde sessionStorage
  hydrateFromSession: () => {
    try {
      const s = sessionStorage.getItem("user");
      if (!s) return;
      const parsed = JSON.parse(s);
      const u = normalizeUser(parsed);
      if (u) {
        set({
          user: u,
          nombre: u.username,
            usuario: u.username,
          rol: u.roleId,
          sur: u.sucursal,
          id_tenant: u.id_tenant
        });
      }
    } catch {
      /* silencioso */
    }
  },

  clearUser: () =>
    set({
      user: null,
      nombre: "",
      usuario: "",
      rol: "",
      sur: "",
      almacen: "",
      id_tenant: ""
    })
}));

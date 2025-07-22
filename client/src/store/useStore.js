import { create } from "zustand";

export const useUserStore = create((set) => ({
  nombre: "",
  usuario: "", 
  rol: "",
  sur: "",
  almacen: "",
  id_tenant: "",  
  setNombre: (nombre) => set({ nombre }),
  setUsuario: (usuario) => set({ usuario }), // Setter para usuario
  setIdRol: (rol) => set({ rol }),
  setSur: (sur) => set({ sur }),
  setAlmacen: (almacen) => set({ almacen }), // Setter añadido
  setIdTenant: (id_tenant) => set({ id_tenant }), // Setter añadido
  clearUser: () => set({ nombre: "", usuario: "", rol: "", sur: "", almacen: "", id_tenant: "" }),
}));
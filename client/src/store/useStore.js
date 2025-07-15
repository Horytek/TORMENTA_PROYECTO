import { create } from "zustand";

export const useUserStore = create((set) => ({
  nombre: "",
  usuario: "", 
  rol: "",
  sur: "",
  almacen: "", 
  setNombre: (nombre) => set({ nombre }),
  setUsuario: (usuario) => set({ usuario }), // Setter para usuario
  setIdRol: (rol) => set({ rol }),
  setSur: (sur) => set({ sur }),
  setAlmacen: (almacen) => set({ almacen }), // Setter añadido
  clearUser: () => set({ nombre: "", usuario: "", rol: "", sur: "", almacen: "" }),
}));
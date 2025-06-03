import { create } from "zustand";

export const useUserStore = create((set) => ({
  nombre: "",
  rol: null,
  sur: "",
  almacen: "", // Añadido
  setNombre: (nombre) => set({ nombre }),
  setIdRol: (rol) => set({ rol }),
  setSur: (sur) => set({ sur }),
  setAlmacen: (almacen) => set({ almacen }), // Setter añadido
  clearUser: () => set({ nombre: "", rol: null, sur: "", almacen: "" }),
}));
import { create } from "zustand";
export const useRegistroTemp = create((set) => ({
  emailEmpresa: null,
  setEmailEmpresa: (email) => set({ emailEmpresa: email }),
  clearEmailEmpresa: () => set({ emailEmpresa: null }),
}));
import { create } from "zustand";

export const useRegistroTemp = create((set) => ({
  sunatFiles: null,
  setSunatFiles: (files) => set({ sunatFiles: files }),
  clearSunatFiles: () => set({ sunatFiles: null }),
  emailEmpresa: null,
  setEmailEmpresa: (email) => set({ emailEmpresa: email }),
  clearEmailEmpresa: () => set({ emailEmpresa: null }),
}));
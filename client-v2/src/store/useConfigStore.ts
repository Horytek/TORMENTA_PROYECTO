import { create } from "zustand";

interface ConfigStore {
  igv_incluido: boolean; // true = precio incluye IGV, false = precio sin IGV
  setIgvIncluido: (v: boolean) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  igv_incluido: true, // default:假设价格含税（更常见的做法）
  setIgvIncluido: (igv_incluido) => set({ igv_incluido }),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  id_sucursal: number | null;
  setSucursal: (id: number | null) => void;
};

export const useCatalogBranchStore = create<State>()(
  persist(
    (set) => ({
      id_sucursal: null,
      setSucursal: (id_sucursal) => set({ id_sucursal }),
    }),
    { name: "catalogo-branch-v1" }
  )
);

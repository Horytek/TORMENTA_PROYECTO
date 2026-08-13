import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  id_sucursal: number | null;
  setSucursal: (id: number | null) => void;
};

export const useAdminBranchFilter = create<State>()(
  persist(
    (set) => ({
      id_sucursal: null,
      setSucursal: (id) => set({ id_sucursal: id }),
    }),
    { name: "horytek-ecom-admin-branch" }
  )
);

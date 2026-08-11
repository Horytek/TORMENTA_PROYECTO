import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreSucursal } from "../types/storefront";

type BranchState = {
  slug: string | null;
  id_sucursal: number | null;
  sucursales: StoreSucursal[];
  initForStore: (slug: string, sucursales: StoreSucursal[]) => void;
  setBranch: (id_sucursal: number) => void;
  activeBranch: () => StoreSucursal | null;
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      slug: null,
      id_sucursal: null,
      sucursales: [],
      initForStore: (slug, sucursales) => {
        const cur = get();
        const sameStore = cur.slug === slug;
        let id_sucursal = sameStore ? cur.id_sucursal : null;
        if (id_sucursal && !sucursales.some((s) => s.id_sucursal === id_sucursal)) {
          id_sucursal = null;
        }
        if (!id_sucursal && sucursales.length) {
          const def = sucursales.find((s) => s.es_default) || sucursales[0];
          id_sucursal = def.id_sucursal;
        }
        set({ slug, sucursales, id_sucursal });
      },
      setBranch: (id_sucursal) => set({ id_sucursal }),
      activeBranch: () => {
        const { id_sucursal, sucursales } = get();
        if (!id_sucursal) return null;
        return sucursales.find((s) => s.id_sucursal === id_sucursal) || null;
      },
    }),
    { name: "horytek-ecommerce-branch" }
  )
);

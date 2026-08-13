import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Comprador } from "../types";

type State = {
  token: string | null;
  comprador: Comprador | null;
  slug: string | null;
  setAuth: (slug: string, token: string, comprador: Comprador) => void;
  logout: () => void;
};

export const useCatalogBuyerStore = create<State>()(
  persist(
    (set) => ({
      token: null,
      comprador: null,
      slug: null,
      setAuth: (slug, token, comprador) => set({ slug, token, comprador }),
      logout: () => set({ token: null, comprador: null }),
    }),
    { name: "catalogo-buyer-v1" }
  )
);

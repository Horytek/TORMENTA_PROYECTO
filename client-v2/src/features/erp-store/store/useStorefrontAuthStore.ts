import { create } from "zustand";
import {
  clearStorefrontToken,
  getStorefrontToken,
  setStorefrontToken,
} from "../api/erpStore";

export type StorefrontUser = {
  id_cliente: number;
  email: string;
  nombre: string;
  telefono?: string | null;
  /** ERP: aislamiento por tenant (legacy alias id_tienda en algunos payloads mapeados) */
  id_tenant: number;
  id_tienda?: number;
  slug: string;
};

type State = {
  token: string | null;
  user: StorefrontUser | null;
  slug: string | null;
  setSession: (token: string, user: StorefrontUser, slug: string) => void;
  clear: () => void;
  hydrate: (slug: string) => void;
};

export const useStorefrontAuthStore = create<State>((set) => ({
  token: null,
  user: null,
  slug: null,
  setSession: (token, user, slug) => {
    setStorefrontToken(slug, token);
    set({ token, user, slug });
  },
  clear: () => {
    const s = useStorefrontAuthStore.getState().slug;
    if (s) clearStorefrontToken(s);
    set({ token: null, user: null });
  },
  hydrate: (slug) => {
    const token = getStorefrontToken(slug);
    set((state) => {
      if (!token) {
        return { token: null, slug, user: null };
      }
      // Misma tienda + mismo token: conservar user (evita flash/logout al remontar header).
      if (state.slug === slug && state.token === token) {
        return { token, slug, user: state.user };
      }
      return {
        token,
        slug,
        user: state.slug === slug ? state.user : null,
      };
    });
  },
}));

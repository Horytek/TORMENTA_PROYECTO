import { create } from "zustand";
import {
  clearStorefrontToken,
  getStorefrontToken,
  setStorefrontToken,
} from "../api/ecommerce";

export type StorefrontUser = {
  id_cliente: number;
  email: string;
  nombre: string;
  telefono?: string | null;
  id_tienda: number;
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
    set({ token, slug, user: null });
  },
}));

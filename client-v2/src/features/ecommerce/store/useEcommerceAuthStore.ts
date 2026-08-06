import { create } from "zustand";
import { clearEcommerceToken, getEcommerceToken, setEcommerceToken } from "../api/ecommerce";

type EcomUser = {
  usuario: string;
  email: string;
  id_tenant: number;
  slug: string;
  tienda: string;
};

type State = {
  token: string | null;
  user: EcomUser | null;
  setSession: (token: string, user: EcomUser) => void;
  clear: () => void;
  hydrate: () => void;
};

export const useEcommerceAuthStore = create<State>((set) => ({
  token: null,
  user: null,
  setSession: (token, user) => {
    setEcommerceToken(token);
    set({ token, user });
  },
  clear: () => {
    clearEcommerceToken();
    set({ token: null, user: null });
  },
  hydrate: () => {
    const token = getEcommerceToken();
    set({ token });
  },
}));

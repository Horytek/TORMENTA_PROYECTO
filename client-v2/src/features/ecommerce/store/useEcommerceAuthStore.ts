import { create } from "zustand";
import { clearEcommerceToken, getEcommerceToken, setEcommerceToken } from "../api/ecommerce";

export type EcomSucursalRef = { id_sucursal: number; nombre: string };

export type EcomUser = {
  usuario: string;
  email: string;
  id_tienda: number;
  slug: string;
  tienda: string;
  permisos?: string[];
  sucursales?: EcomSucursalRef[];
  acceso_global?: boolean;
  rol?: { codigo?: string; nombre?: string };
};

type State = {
  token: string | null;
  user: EcomUser | null;
  setSession: (token: string, user: EcomUser) => void;
  clear: () => void;
  hydrate: () => void;
  hasPermiso: (codigo: string) => boolean;
};

export const useEcommerceAuthStore = create<State>((set, get) => ({
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
  hasPermiso: (codigo) => {
    const perms = get().user?.permisos;
    if (!perms || !perms.length) return true;
    return perms.includes(codigo);
  },
}));

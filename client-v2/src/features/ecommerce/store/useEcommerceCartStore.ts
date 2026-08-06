import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EcomCartItem = {
  id_producto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen_url?: string | null;
};

type CartState = {
  slug: string | null;
  items: EcomCartItem[];
  setSlug: (slug: string) => void;
  add: (item: Omit<EcomCartItem, "cantidad">, qty?: number) => void;
  setQty: (id_producto: number, cantidad: number) => void;
  remove: (id_producto: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useEcommerceCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      slug: null,
      items: [],
      setSlug: (slug) => {
        const cur = get().slug;
        if (cur && cur !== slug) set({ slug, items: [] });
        else set({ slug });
      },
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id_producto === item.id_producto);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id_producto === item.id_producto
                  ? { ...i, cantidad: i.cantidad + qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, cantidad: qty }] };
        }),
      setQty: (id_producto, cantidad) =>
        set((state) => ({
          items:
            cantidad <= 0
              ? state.items.filter((i) => i.id_producto !== id_producto)
              : state.items.map((i) =>
                  i.id_producto === id_producto ? { ...i, cantidad } : i
                ),
        })),
      remove: (id_producto) =>
        set((state) => ({ items: state.items.filter((i) => i.id_producto !== id_producto) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.precio * i.cantidad, 0),
      count: () => get().items.reduce((s, i) => s + i.cantidad, 0),
    }),
    { name: "horytek-ecommerce-cart" }
  )
);

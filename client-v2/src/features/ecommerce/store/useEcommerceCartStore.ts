import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AttrSeleccion = {
  id_atributo: number;
  id_valor?: number | null;
  valor?: string;
};

export type EcomCartItem = {
  line_key: string;
  id_producto: number;
  id_variante?: number | null;
  id_solicitud?: number | null;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen_url?: string | null;
  selecciones?: AttrSeleccion[];
  attrs_label?: string;
};

type CartState = {
  slug: string | null;
  items: EcomCartItem[];
  setSlug: (slug: string) => void;
  add: (item: Omit<EcomCartItem, "cantidad" | "line_key"> & { line_key?: string }, qty?: number) => void;
  setQty: (line_key: string, cantidad: number) => void;
  remove: (line_key: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export function cartLineKey(
  id_producto: number,
  id_variante?: number | null,
  selecciones?: AttrSeleccion[],
  id_solicitud?: number | null
) {
  const hash = JSON.stringify(
    (selecciones || [])
      .map((s) => [s.id_atributo, s.id_valor ?? s.valor ?? ""])
      .sort((a, b) => Number(a[0]) - Number(b[0]))
  );
  return `${id_producto}:${id_variante || 0}:${id_solicitud || 0}:${hash}`;
}

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
          const line_key =
            item.line_key ||
            cartLineKey(item.id_producto, item.id_variante, item.selecciones, item.id_solicitud);
          const existing = state.items.find((i) => i.line_key === line_key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.line_key === line_key ? { ...i, cantidad: i.cantidad + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, line_key, cantidad: qty }] };
        }),
      setQty: (line_key, cantidad) =>
        set((state) => ({
          items:
            cantidad <= 0
              ? state.items.filter((i) => i.line_key !== line_key)
              : state.items.map((i) => (i.line_key === line_key ? { ...i, cantidad } : i)),
        })),
      remove: (line_key) =>
        set((state) => ({ items: state.items.filter((i) => i.line_key !== line_key) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.precio * i.cantidad, 0),
      count: () => get().items.reduce((s, i) => s + i.cantidad, 0),
    }),
    {
      name: "horytek-ecommerce-cart",
      version: 1,
      migrate: (persisted) => {
        const p = (persisted || {}) as { slug?: string | null; items?: EcomCartItem[] };
        return {
          slug: p.slug ?? null,
          items: (p.items || []).map((i) => ({
            ...i,
            line_key: i.line_key || cartLineKey(i.id_producto, i.id_variante, i.selecciones, i.id_solicitud),
          })),
        };
      },
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CarritoItem, CatalogoProducto } from "../types";

type State = {
  slug: string | null;
  items: CarritoItem[];
  setSlug: (slug: string) => void;
  addItem: (producto: CatalogoProducto, opts?: { cantidad?: number; id_sku?: number; attrs?: Record<string, string>; precio_unitario?: number }) => void;
  updateQty: (codigo: number, id_sku: number | null | undefined, cantidad: number) => void;
  removeItem: (codigo: number, id_sku?: number | null) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCatalogCartStore = create<State>()(
  persist(
    (set, get) => ({
      slug: null,
      items: [],
      setSlug: (slug) => {
        const cur = get().slug;
        if (cur && cur !== slug) set({ slug, items: [] });
        else set({ slug });
      },
      addItem: (producto, opts = {}) => {
        const cantidad = opts.cantidad ?? 1;
        const id_sku = opts.id_sku ?? null;
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.producto.codigo === producto.codigo && (i.id_sku ?? null) === id_sku
          );
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidad };
            return { items: next };
          }
          return {
            items: [
              ...state.items,
              {
                producto,
                cantidad,
                id_sku,
                attrs: opts.attrs,
                precio_unitario: opts.precio_unitario ?? producto.precio,
              },
            ],
          };
        });
      },
      updateQty: (codigo, id_sku, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(codigo, id_sku);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.producto.codigo === codigo && (i.id_sku ?? null) === (id_sku ?? null)
              ? { ...i, cantidad }
              : i
          ),
        }));
      },
      removeItem: (codigo, id_sku) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.producto.codigo === codigo && (i.id_sku ?? null) === (id_sku ?? null))
          ),
        })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((s, i) => s + i.cantidad, 0),
      subtotal: () =>
        get().items.reduce(
          (s, i) => s + (i.precio_unitario ?? i.producto.precio) * i.cantidad,
          0
        ),
    }),
    { name: "catalogo-cart-v2" }
  )
);

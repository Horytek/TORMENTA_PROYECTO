import { create } from "zustand";
import type { ExpressCartLine, ExpressProduct } from "../types";

// ─────────────────────────────────────────────────────────────────
// useExpressCartStore — carrito de Pocket POS (mucho más simple que
// el carrito del ERP: sin IGV, sin descuento por línea, sin SKU/variantes).
// No persiste entre refrescos a propósito (una venta express es rápida,
// no vale la pena arrastrar un carrito viejo).
// ─────────────────────────────────────────────────────────────────

interface ExpressCartStore {
  items: ExpressCartLine[];
  addItem: (product: ExpressProduct) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  clear: () => void;
  getTotal: () => number;
  getCount: () => number;
}

export const useExpressCartStore = create<ExpressCartStore>()((set, get) => ({
  items: [],

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return state;
        return {
          items: state.items.map((i) =>
            i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      if (product.stock <= 0) return state;
      return {
        items: [
          ...state.items,
          { product_id: product.id, name: product.name, price: Number(product.price), quantity: 1, stock: product.stock },
        ],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.product_id !== productId) }));
  },

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i
      ),
    }));
  },

  clear: () => set({ items: [] }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

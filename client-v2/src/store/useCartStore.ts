import { create } from "zustand";
import type { CartItem, ClienteForSale, ComprobanteTipo, MetodoPago } from "@/features/sales/types";

// ─────────────────────────────────────────────────────────────────
// useCartStore — Estado global del carrito de compras (POS)
// ─────────────────────────────────────────────────────────────────

interface CartStore {
  // ── Estado ──────────────────────────────────────────────────
  items: CartItem[];
  cliente: ClienteForSale | null;
  comprobanteTipo: ComprobanteTipo;
  metodoPago: MetodoPago;
  montoRecibido: number;
  observaciones: string;
  isProcessing: boolean; // true mientras se envía a SUNAT

  // ── Acciones ─────────────────────────────────────────────────
  addItem: (product: CartItem) => void;
  removeItem: (idVariante: number) => void;
  updateQuantity: (idVariante: number, cantidad: number) => void;
  clearCart: () => void;
  setCliente: (cliente: ClienteForSale | null) => void;
  setComprobanteTipo: (tipo: ComprobanteTipo) => void;
  setMetodoPago: (metodo: MetodoPago) => void;
  setMontoRecibido: (monto: number) => void;
  setObservaciones: (obs: string) => void;
  setIsProcessing: (v: boolean) => void;

  // ── Computados (como getters del estado) ────────────────────
  getSubtotal: () => number;
  getIgv: () => number;
  getTotal: () => number;
  getVuelto: () => number;
  getItemCount: () => number;
  getItem: (idVariante: number) => CartItem | undefined;
}

const IGV_RATE = 0.18;

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  cliente: null,
  comprobanteTipo: "Boleta",
  metodoPago: "EFECTIVO",
  montoRecibido: 0,
  observaciones: "",
  isProcessing: false,

  // ── Add ─────────────────────────────────────────────────────
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.id_variante === product.id_variante);
      if (existing) {
        // Incrementar cantidad si ya existe
        const updated = state.items.map((i) =>
          i.id_variante === product.id_variante
            ? {
                ...i,
                cantidad: i.cantidad + product.cantidad,
                precio_total: (i.cantidad + product.cantidad) * i.precio_unitario,
              }
            : i
        );
        return { items: updated };
      }
      // Agregar nuevo
      return { items: [...state.items, product] };
    });
  },

  // ── Remove ───────────────────────────────────────────────────
  removeItem: (idVariante) => {
    set((state) => ({ items: state.items.filter((i) => i.id_variante !== idVariante) }));
  },

  // ── Update quantity ─────────────────────────────────────────
  updateQuantity: (idVariante, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(idVariante);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.id_variante === idVariante
          ? { ...i, cantidad, precio_total: cantidad * i.precio_unitario }
          : i
      ),
    }));
  },

  // ── Clear ────────────────────────────────────────────────────
  clearCart: () =>
    set({
      items: [],
      cliente: null,
      montoRecibido: 0,
      observaciones: "",
      isProcessing: false,
    }),

  // ── Setters ──────────────────────────────────────────────────
  setCliente: (cliente) => set({ cliente }),
  setComprobanteTipo: (comprobanteTipo) => set({ comprobanteTipo }),
  setMetodoPago: (metodoPago) => set({ metodoPago }),
  setMontoRecibido: (montoRecibido) => set({ montoRecibido }),
  setObservaciones: (observaciones) => set({ observaciones }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),

  // ── Computados ───────────────────────────────────────────────
  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + i.precio_total, 0);
  },

  getIgv: () => {
    const subtotal = get().getSubtotal();
    return Math.round(subtotal * IGV_RATE * 100) / 100;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const igv = Math.round(subtotal * IGV_RATE * 100) / 100;
    return Math.round((subtotal + igv) * 100) / 100;
  },

  getVuelto: () => {
    const total = get().getTotal();
    const { montoRecibido } = get();
    return Math.max(0, montoRecibido - total);
  },

  getItemCount: () => {
    return get().items.reduce((sum, i) => sum + i.cantidad, 0);
  },

  getItem: (idVariante) => {
    return get().items.find((i) => i.id_variante === idVariante);
  },
}));

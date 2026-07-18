import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ClienteForSale, ComprobanteTipo, MetodoPago } from "@/features/sales/types";
import { useConfigStore } from "./useConfigStore";

// ─────────────────────────────────────────────────────────────────
// useCartStore — Estado global del carrito de compras (POS)
// ─────────────────────────────────────────────────────────────────

/** Snapshot de un carrito "aparcado" — permite atender varios clientes en
 * paralelo (mostrador único, varios clientes probándose ropa a la vez). */
export interface HeldTicket {
  id: string;
  label: string;
  createdAt: number;
  items: CartItem[];
  cliente: ClienteForSale | null;
  comprobanteTipo: ComprobanteTipo;
  metodoPago: MetodoPago;
  observaciones: string;
}

interface CartStore {
  // ── Estado ──────────────────────────────────────────────────
  items: CartItem[];
  cliente: ClienteForSale | null;
  comprobanteTipo: ComprobanteTipo;
  metodoPago: MetodoPago;
  montoRecibido: number;
  observaciones: string;
  descuento: number; // monto de descuento aplicado al total (Fase 7)
  isProcessing: boolean; // true mientras se envía a SUNAT
  heldTickets: HeldTicket[];

  // ── Acciones ─────────────────────────────────────────────────
  addItem: (product: CartItem) => void;
  removeItem: (idProducto: number) => void;
  updateQuantity: (idProducto: number, cantidad: number) => void;
  clearCart: () => void;
  setCliente: (cliente: ClienteForSale | null) => void;
  setComprobanteTipo: (tipo: ComprobanteTipo) => void;
  setMetodoPago: (metodo: MetodoPago) => void;
  setMontoRecibido: (monto: number) => void;
  setObservaciones: (obs: string) => void;
  setDescuento: (monto: number) => void;
  setIsProcessing: (v: boolean) => void;

  // ── Tickets en espera ────────────────────────────────────────
  holdCurrentCart: () => void;
  resumeTicket: (id: string) => void;
  discardTicket: (id: string) => void;

  // ── Computados (como getters del estado) ────────────────────
  getSubtotal: () => number;
  getIgv: () => number;
  getTotal: () => number;
  getVuelto: () => number;
  getItemCount: () => number;
  getItem: (idProducto: number) => CartItem | undefined;
}

const IGV_RATE = 0.18;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cliente: null,
      comprobanteTipo: "Boleta",
      metodoPago: "EFECTIVO",
      montoRecibido: 0,
      observaciones: "",
      descuento: 0,
      isProcessing: false,
      heldTickets: [],

      // ── Add ─────────────────────────────────────────────────────
      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.id_producto === product.id_producto);
          if (existing) {
            // Incrementar cantidad si ya existe
            const updated = state.items.map((i) =>
              i.id_producto === product.id_producto
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
      removeItem: (idProducto) => {
        set((state) => ({ items: state.items.filter((i) => i.id_producto !== idProducto) }));
      },

      // ── Update quantity ─────────────────────────────────────────
      updateQuantity: (idProducto, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(idProducto);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id_producto === idProducto
              ? { ...i, cantidad, precio_total: cantidad * i.precio_unitario }
              : i
          ),
        }));
      },

      // ── Clear — reinicia TODO para una nueva venta ─────────────────
      clearCart: () =>
        set({
          items: [],
          cliente: null,
          comprobanteTipo: "Boleta",
          metodoPago: "EFECTIVO",
          montoRecibido: 0,
          observaciones: "",
          descuento: 0,
          isProcessing: false,
        }),

      // ── Setters ──────────────────────────────────────────────────
      setCliente: (cliente) => set({ cliente }),
      setComprobanteTipo: (comprobanteTipo) => set({ comprobanteTipo }),
      setMetodoPago: (metodoPago) => set({ metodoPago }),
      setMontoRecibido: (montoRecibido) => set({ montoRecibido }),
      setObservaciones: (observaciones) => set({ observaciones }),
      setDescuento: (descuento) => set({ descuento: Math.max(0, descuento) }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),

      // ── Tickets en espera ────────────────────────────────────────
      holdCurrentCart: () => {
        const state = get();
        if (state.items.length === 0) return;
        const label = state.cliente
          ? state.cliente.razon_social || [state.cliente.nombres, state.cliente.apellidos].filter(Boolean).join(" ") || "Cliente"
          : "Venta rápida";
        const ticket: HeldTicket = {
          id: crypto.randomUUID(),
          label,
          createdAt: Date.now(),
          items: state.items,
          cliente: state.cliente,
          comprobanteTipo: state.comprobanteTipo,
          metodoPago: state.metodoPago,
          observaciones: state.observaciones,
        };
        set((s) => ({
          heldTickets: [ticket, ...s.heldTickets],
          items: [],
          cliente: null,
          comprobanteTipo: "Boleta",
          metodoPago: "EFECTIVO",
          montoRecibido: 0,
          observaciones: "",
          descuento: 0,
        }));
      },

      resumeTicket: (id) => {
        const ticket = get().heldTickets.find((t) => t.id === id);
        if (!ticket) return;
        set((s) => ({
          items: ticket.items,
          cliente: ticket.cliente,
          comprobanteTipo: ticket.comprobanteTipo,
          metodoPago: ticket.metodoPago,
          observaciones: ticket.observaciones,
          montoRecibido: 0,
          descuento: 0,
          heldTickets: s.heldTickets.filter((t) => t.id !== id),
        }));
      },

      discardTicket: (id) => {
        set((s) => ({ heldTickets: s.heldTickets.filter((t) => t.id !== id) }));
      },

      // ── Computados ───────────────────────────────────────────────
      getSubtotal: () => {
        const { items } = get();
        const rawSum = items.reduce((sum, i) => sum + i.precio_total, 0);
        const igv_incluido = useConfigStore.getState().igv_incluido;
        if (igv_incluido) {
          const base = rawSum / (1 + IGV_RATE);
          return Math.round(base * 100) / 100;
        }
        return Math.round(rawSum * 100) / 100;
      },

      getIgv: () => {
        const { items } = get();
        const rawSum = items.reduce((sum, i) => sum + i.precio_total, 0);
        const igv_incluido = useConfigStore.getState().igv_incluido;
        if (igv_incluido) {
          return Math.round((rawSum - rawSum / (1 + IGV_RATE)) * 100) / 100;
        }
        const subtotal = get().getSubtotal();
        return Math.round(subtotal * IGV_RATE * 100) / 100;
      },

      getTotal: () => {
        const { items, descuento } = get();
        const rawSum = items.reduce((sum, i) => sum + i.precio_total, 0);
        const igv_incluido = useConfigStore.getState().igv_incluido;
        let total: number;
        if (igv_incluido) {
          total = rawSum;
        } else {
          const subtotal = get().getSubtotal();
          const igv = Math.round(subtotal * IGV_RATE * 100) / 100;
          total = subtotal + igv;
        }
        return Math.max(0, Math.round((total - descuento) * 100) / 100);
      },

      getVuelto: () => {
        const total = get().getTotal();
        const { montoRecibido } = get();
        return Math.max(0, montoRecibido - total);
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.cantidad, 0);
      },

      getItem: (idProducto) => {
        return get().items.find((i) => i.id_producto === idProducto);
      },
    }),
    {
      name: "pos-cart-storage",
      // Solo persistimos los tickets aparcados — el carrito activo y el
      // estado de cobro en curso no deben sobrevivir a un refresh accidental.
      partialize: (state) => ({ heldTickets: state.heldTickets }),
    }
  )
);

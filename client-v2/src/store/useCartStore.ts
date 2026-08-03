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
  removeItem: (idProducto: number, idSku?: number | null) => void;
  updateQuantity: (idProducto: number, cantidad: number, idSku?: number | null) => void;
  setLineDiscount: (idProducto: number, monto: number, idSku?: number | null) => void;
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
  getItem: (idProducto: number, idSku?: number | null) => CartItem | undefined;
}

/** Clave de identidad de un item: mismo producto Y misma variante (o ninguna). */
const mismoItem = (i: CartItem, idProducto: number, idSku?: number | null) =>
  i.id_producto === idProducto && (i.id_sku ?? null) === (idSku ?? null);

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
          const existing = state.items.find((i) => mismoItem(i, product.id_producto, product.id_sku));
          if (existing) {
            // Incrementar cantidad si ya existe la misma variante
            const updated = state.items.map((i) =>
              mismoItem(i, product.id_producto, product.id_sku)
                ? {
                    ...i,
                    cantidad: i.cantidad + product.cantidad,
                    precio_total: Math.max(0, (i.cantidad + product.cantidad) * i.precio_unitario - (i.descuento ?? 0)),
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
      removeItem: (idProducto, idSku) => {
        set((state) => ({ items: state.items.filter((i) => !mismoItem(i, idProducto, idSku)) }));
      },

      // ── Update quantity ─────────────────────────────────────────
      updateQuantity: (idProducto, cantidad, idSku) => {
        if (cantidad <= 0) {
          get().removeItem(idProducto, idSku);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            mismoItem(i, idProducto, idSku)
              ? { ...i, cantidad, precio_total: Math.max(0, cantidad * i.precio_unitario - (i.descuento ?? 0)) }
              : i
          ),
        }));
      },

      // ── Descuento por línea (monto, no %) ──────────────────────────
      setLineDiscount: (idProducto, monto, idSku) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (!mismoItem(i, idProducto, idSku)) return i;
            const bruto = i.cantidad * i.precio_unitario;
            const descuento = Math.min(Math.max(0, monto), bruto);
            return { ...i, descuento, precio_total: bruto - descuento };
          }),
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
      // Exonerado/inafecto (catálogo 07 SUNAT) no llevan IGV — el 18% plano
      // solo aplica a líneas gravadas (el default histórico, cuando el
      // producto no trae tipo_afectacion_igv).
      getSubtotal: () => {
        const { items } = get();
        const igv_incluido = useConfigStore.getState().igv_incluido;
        const base = items.reduce((sum, i) => {
          const gravado = (i.tipo_afectacion_igv ?? "10") === "10";
          if (!gravado) return sum + i.precio_total;
          return sum + (igv_incluido ? i.precio_total / (1 + IGV_RATE) : i.precio_total);
        }, 0);
        return Math.round(base * 100) / 100;
      },

      getIgv: () => {
        const { items } = get();
        const igv_incluido = useConfigStore.getState().igv_incluido;
        const igv = items.reduce((sum, i) => {
          const gravado = (i.tipo_afectacion_igv ?? "10") === "10";
          if (!gravado) return sum;
          return sum + (igv_incluido ? i.precio_total - i.precio_total / (1 + IGV_RATE) : i.precio_total * IGV_RATE);
        }, 0);
        return Math.round(igv * 100) / 100;
      },

      getTotal: () => {
        const { items, descuento } = get();
        const rawSum = items.reduce((sum, i) => sum + i.precio_total, 0);
        const igv_incluido = useConfigStore.getState().igv_incluido;
        const total = igv_incluido ? rawSum : get().getSubtotal() + get().getIgv();
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

      getItem: (idProducto, idSku) => {
        return get().items.find((i) => mismoItem(i, idProducto, idSku));
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

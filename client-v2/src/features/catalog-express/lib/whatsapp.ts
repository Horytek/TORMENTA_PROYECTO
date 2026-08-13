import type { CarritoItem } from "../types";

/** Perú: celulares son 9 dígitos: WhatsApp necesita el prefijo de país 51 antepuesto. */
export function normalizarTelefono(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  const digitos = telefono.replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.length === 9) return `51${digitos}`;
  return digitos;
}

export function formatearMensajePedido(items: CarritoItem[], nombreNegocio: string): string {
  const lineas = items.map((it) => {
    const precio = it.precio_unitario ?? it.producto.precio;
    return `• ${it.cantidad}x ${it.producto.descripcion} — S/ ${(precio * it.cantidad).toFixed(2)}`;
  });
  const total = items.reduce(
    (sum, it) => sum + (it.precio_unitario ?? it.producto.precio) * it.cantidad,
    0
  );
  return [
    `Hola ${nombreNegocio}, quiero hacer este pedido:`,
    "",
    ...lineas,
    "",
    `Total: S/ ${total.toFixed(2)}`,
  ].join("\n");
}

export function construirEnlaceWhatsApp(telefono: string | null, mensaje: string): string | null {
  const numero = normalizarTelefono(telefono);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

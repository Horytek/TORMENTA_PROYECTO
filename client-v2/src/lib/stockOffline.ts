import type { POSProduct } from "@/features/sales/types";
import type { VentaPendiente } from "./offlineOutbox";

/**
 * Stock que se puede seguir vendiendo sin conexión.
 *
 * El catálogo offline es una foto tomada en la última conexión. Si no se le
 * descuenta lo ya vendido desde entonces, la misma prenda se vende una y otra
 * vez: la cajera ve "3 disponibles" después de haber vendido las 3, y al
 * reconectar dos de esas ventas rebotan con 409.
 *
 * No sustituye al control del servidor —otra caja pudo vender lo mismo— pero
 * evita el caso más común, que es sobrevender contra uno mismo.
 */

interface LineaVendida {
  id_producto?: number;
  codigo?: number;
  cantidad?: number;
}

/** Unidades ya comprometidas por producto en las ventas que esperan enviarse. */
export function unidadesComprometidas(pendientes: VentaPendiente[]): Map<number, number> {
  const porProducto = new Map<number, number>();

  for (const venta of pendientes ?? []) {
    // Una venta rechazada por el servidor no reserva nada: su stock nunca salió.
    if (venta.rechazada) continue;

    const payload = venta.payload as { detalles?: LineaVendida[] } | undefined;
    for (const linea of payload?.detalles ?? []) {
      const id = Number(linea?.id_producto ?? linea?.codigo);
      const cantidad = Number(linea?.cantidad);
      if (!Number.isInteger(id) || id <= 0) continue;
      if (!Number.isFinite(cantidad) || cantidad <= 0) continue;
      porProducto.set(id, (porProducto.get(id) ?? 0) + cantidad);
    }
  }

  return porProducto;
}

/**
 * Aplica lo comprometido sobre la foto del catálogo.
 * Nunca devuelve stock negativo: si ya se vendió de más, muestra 0.
 */
export function catalogoConStockOffline(
  productos: POSProduct[],
  pendientes: VentaPendiente[]
): POSProduct[] {
  const comprometido = unidadesComprometidas(pendientes);
  if (comprometido.size === 0) return productos ?? [];

  return (productos ?? []).map((p) => {
    const usado = comprometido.get(Number(p.codigo)) ?? 0;
    if (usado === 0) return p;
    return { ...p, stock: Math.max(0, Number(p.stock ?? 0) - usado) };
  });
}

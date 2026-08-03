import { describe, it, expect } from "vitest";
import { unidadesComprometidas, catalogoConStockOffline } from "./stockOffline";
import type { VentaPendiente } from "./offlineOutbox";
import type { POSProduct } from "@/features/sales/types";

/**
 * Sin este descuento, la foto del catálogo miente mientras no hay conexión: la
 * cajera vende 3 polos y sigue viendo 3 disponibles, vende otros 3, y al
 * reconectar la mitad de las ventas rebotan por falta de stock.
 */

const venta = (detalles: unknown[], extra: Partial<VentaPendiente> = {}): VentaPendiente => ({
  idempotency_key: Math.random().toString(36),
  payload: { detalles },
  creado_en: Date.now(),
  intentos: 0,
  ...extra,
});

const producto = (codigo: number, stock: number): POSProduct =>
  ({ codigo, nombre: `P${codigo}`, precio: 10, stock, undm: "NIU" }) as POSProduct;

describe("unidadesComprometidas", () => {
  it("suma las cantidades del mismo producto en varias ventas", () => {
    const m = unidadesComprometidas([
      venta([{ id_producto: 7, cantidad: 2 }]),
      venta([{ id_producto: 7, cantidad: 3 }]),
    ]);
    expect(m.get(7)).toBe(5);
  });

  it("suma varias líneas dentro de una misma venta", () => {
    const m = unidadesComprometidas([
      venta([{ id_producto: 7, cantidad: 2 }, { id_producto: 9, cantidad: 1 }]),
    ]);
    expect(m.get(7)).toBe(2);
    expect(m.get(9)).toBe(1);
  });

  it("una venta RECHAZADA no reserva stock: nunca salió del almacén", () => {
    const m = unidadesComprometidas([venta([{ id_producto: 7, cantidad: 4 }], { rechazada: true })]);
    expect(m.get(7)).toBeUndefined();
  });

  it("ignora líneas con datos basura en vez de romper la caja", () => {
    const m = unidadesComprometidas([
      venta([
        { id_producto: 0, cantidad: 5 },
        { id_producto: 7, cantidad: 0 },
        { id_producto: 7, cantidad: -3 },
        { cantidad: 2 },
        {},
      ]),
    ]);
    expect(m.size).toBe(0);
  });

  it("no revienta con una cola vacía o indefinida", () => {
    expect(unidadesComprometidas([]).size).toBe(0);
    expect(unidadesComprometidas(undefined as never).size).toBe(0);
  });
});

describe("catalogoConStockOffline", () => {
  const catalogo = [producto(7, 10), producto(9, 4)];

  it("descuenta lo vendido offline del stock mostrado", () => {
    const r = catalogoConStockOffline(catalogo, [venta([{ id_producto: 7, cantidad: 3 }])]);
    expect(r.find((p) => p.codigo === 7)?.stock).toBe(7);
    expect(r.find((p) => p.codigo === 9)?.stock).toBe(4);
  });

  it("nunca muestra stock negativo", () => {
    const r = catalogoConStockOffline(catalogo, [venta([{ id_producto: 9, cantidad: 99 }])]);
    expect(r.find((p) => p.codigo === 9)?.stock).toBe(0);
  });

  it("sin ventas pendientes devuelve el catálogo tal cual", () => {
    expect(catalogoConStockOffline(catalogo, [])).toBe(catalogo);
  });

  it("no muta el catálogo original", () => {
    catalogoConStockOffline(catalogo, [venta([{ id_producto: 7, cantidad: 3 }])]);
    expect(catalogo[0].stock).toBe(10);
  });
});

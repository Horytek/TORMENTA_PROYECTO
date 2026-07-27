import { describe, it, expect } from "vitest";
import {
  asignarCantidad,
  revertirAsignacion,
  totalAsignado,
  POLITICA,
} from "./asignacionStock.js";

/**
 * De acá sale de qué variante se descuenta cada venta. Equivocarse no da un
 * error visible: descuenta del SKU que no era y el stock por talla deja de
 * reflejar la realidad. Por eso los casos borde pesan más que el camino feliz.
 */

const sku = (id_sku, stock) => ({ id_sku, stock });

describe("asignarCantidad — política concentrar (por defecto)", () => {
  it("con una sola variante con stock, toca solo esa", () => {
    const r = asignarCantidad({ disponibles: [sku(10, 50)], cantidad: 3 });
    expect(r.asignaciones).toEqual([{ id_sku: 10, cantidad: 3 }]);
    expect(r.faltante).toBe(0);
  });

  it("agota primero la variante con más stock", () => {
    const r = asignarCantidad({ disponibles: [sku(10, 2), sku(20, 40)], cantidad: 5 });
    expect(r.asignaciones).toEqual([{ id_sku: 20, cantidad: 5 }]);
  });

  it("pasa a la siguiente cuando la primera no alcanza", () => {
    const r = asignarCantidad({ disponibles: [sku(10, 3), sku(20, 4)], cantidad: 6 });
    expect(r.asignaciones).toEqual([
      { id_sku: 20, cantidad: 4 },
      { id_sku: 10, cantidad: 2 },
    ]);
    expect(totalAsignado(r.asignaciones)).toBe(6);
  });

  it("empate de stock se resuelve por id_sku ascendente (determinista)", () => {
    // El orden importa: el repositorio bloquea las filas en este mismo orden
    // para no generar deadlocks entre ventas simultáneas.
    const r1 = asignarCantidad({ disponibles: [sku(30, 5), sku(10, 5), sku(20, 5)], cantidad: 4 });
    const r2 = asignarCantidad({ disponibles: [sku(20, 5), sku(30, 5), sku(10, 5)], cantidad: 4 });
    expect(r1.asignaciones).toEqual([{ id_sku: 10, cantidad: 4 }]);
    expect(r1.asignaciones).toEqual(r2.asignaciones);
  });
});

describe("asignarCantidad — falta de stock", () => {
  it("asigna lo que hay e informa el faltante en vez de lanzar", () => {
    // No lanza a propósito: el controlador arma el 409 con su propio contexto.
    const r = asignarCantidad({ disponibles: [sku(10, 2)], cantidad: 5 });
    expect(r.asignaciones).toEqual([{ id_sku: 10, cantidad: 2 }]);
    expect(r.faltante).toBe(3);
    expect(r.disponibleTotal).toBe(2);
  });

  it("sin stock en ninguna variante no asigna nada", () => {
    const r = asignarCantidad({ disponibles: [sku(10, 0), sku(20, 0)], cantidad: 3 });
    expect(r.asignaciones).toEqual([]);
    expect(r.faltante).toBe(3);
  });

  it("lista vacía es faltante total, no un error", () => {
    const r = asignarCantidad({ disponibles: [], cantidad: 2 });
    expect(r.faltante).toBe(2);
    expect(r.disponibleTotal).toBe(0);
  });

  it("tolera disponibles nulo", () => {
    expect(asignarCantidad({ disponibles: null, cantidad: 1 }).faltante).toBe(1);
  });
});

describe("asignarCantidad — filas basura", () => {
  it("ignora stock negativo en vez de restarlo del total", () => {
    // Una sobreventa previa dejó -5; sumarlo daría un disponible menor al real.
    const r = asignarCantidad({ disponibles: [sku(10, -5), sku(20, 10)], cantidad: 4 });
    expect(r.disponibleTotal).toBe(10);
    expect(r.asignaciones).toEqual([{ id_sku: 20, cantidad: 4 }]);
  });

  it("descarta filas sin id_sku válido", () => {
    const r = asignarCantidad({
      disponibles: [{ id_sku: null, stock: 99 }, sku(20, 5)],
      cantidad: 3,
    });
    expect(r.asignaciones).toEqual([{ id_sku: 20, cantidad: 3 }]);
  });

  it("nunca devuelve asignaciones en cero", () => {
    const r = asignarCantidad({ disponibles: [sku(10, 5), sku(20, 5)], cantidad: 2 });
    expect(r.asignaciones.every((a) => a.cantidad > 0)).toBe(true);
  });
});

describe("asignarCantidad — cantidad inválida", () => {
  it("rechaza cero, negativos y no enteros", () => {
    // Media prenda no existe; un cero sería una venta sin efecto.
    for (const c of [0, -1, 1.5, "abc", null, undefined]) {
      expect(() => asignarCantidad({ disponibles: [sku(10, 5)], cantidad: c }), String(c)).toThrow(
        /cantidad inválida/i
      );
    }
  });
});

describe("asignarCantidad — política proporcional", () => {
  it("reparte a prorrata del stock", () => {
    const r = asignarCantidad({
      disponibles: [sku(10, 30), sku(20, 10)],
      cantidad: 8,
      politica: POLITICA.PROPORCIONAL,
    });
    expect(totalAsignado(r.asignaciones)).toBe(8);
    const porSku = Object.fromEntries(r.asignaciones.map((a) => [a.id_sku, a.cantidad]));
    expect(porSku[10]).toBe(6);
    expect(porSku[20]).toBe(2);
  });

  it("el redondeo no pierde unidades", () => {
    // 10/3 no es entero: el sobrante debe asignarse igual.
    const r = asignarCantidad({
      disponibles: [sku(10, 10), sku(20, 10), sku(30, 10)],
      cantidad: 10,
      politica: POLITICA.PROPORCIONAL,
    });
    expect(totalAsignado(r.asignaciones)).toBe(10);
  });

  it("nunca asigna a un SKU más de lo que tiene", () => {
    const r = asignarCantidad({
      disponibles: [sku(10, 1), sku(20, 100)],
      cantidad: 50,
      politica: POLITICA.PROPORCIONAL,
    });
    const porSku = Object.fromEntries(r.asignaciones.map((a) => [a.id_sku, a.cantidad]));
    expect(porSku[10] ?? 0).toBeLessThanOrEqual(1);
    expect(totalAsignado(r.asignaciones)).toBe(50);
  });
});

describe("revertirAsignacion", () => {
  it("devuelve las unidades a los mismos SKU", () => {
    // Es lo que permite anular con exactitud: cada unidad vuelve de donde salió.
    const asignaciones = [
      { id_sku: 20, cantidad: 4 },
      { id_sku: 10, cantidad: 2 },
    ];
    expect(revertirAsignacion(asignaciones)).toEqual(asignaciones);
  });

  it("descarta entradas sin efecto", () => {
    const r = revertirAsignacion([
      { id_sku: 10, cantidad: 0 },
      { id_sku: null, cantidad: 5 },
      { id_sku: 20, cantidad: 3 },
    ]);
    expect(r).toEqual([{ id_sku: 20, cantidad: 3 }]);
  });

  it("tolera nulo", () => {
    expect(revertirAsignacion(null)).toEqual([]);
  });
});

describe("invariante: lo asignado nunca supera lo disponible ni lo pedido", () => {
  it("se cumple en un barrido de casos", () => {
    const casos = [
      { disponibles: [sku(1, 7), sku(2, 3)], cantidad: 5 },
      { disponibles: [sku(1, 1)], cantidad: 100 },
      { disponibles: [sku(1, 50), sku(2, 50), sku(3, 50)], cantidad: 120 },
      { disponibles: [sku(1, 0), sku(2, 9)], cantidad: 9 },
    ];
    for (const politica of [POLITICA.CONCENTRAR, POLITICA.PROPORCIONAL]) {
      for (const c of casos) {
        const r = asignarCantidad({ ...c, politica });
        const total = totalAsignado(r.asignaciones);
        expect(total, `${politica} ${JSON.stringify(c)}`).toBeLessThanOrEqual(c.cantidad);
        expect(total).toBeLessThanOrEqual(r.disponibleTotal);
        expect(total + r.faltante).toBe(c.cantidad);
        for (const a of r.asignaciones) {
          const disponible = c.disponibles.find((d) => d.id_sku === a.id_sku).stock;
          expect(a.cantidad).toBeLessThanOrEqual(disponible);
        }
      }
    }
  });
});
